<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

analytics_security_headers("default-src 'none'; frame-ancestors 'none'");
header('Content-Type: application/json; charset=utf-8');

$config = analytics_config();
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $config['allowed_origins'] ?? [];
$originAllowed = $origin !== '' && in_array($origin, $allowedOrigins, true);
if ($originAllowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code($originAllowed ? 204 : 403);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !$originAllowed) {
    http_response_code(403);
    echo '{"ok":false}';
    exit;
}

$agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
if ($agent === '' || preg_match('/bot|crawler|spider|preview|facebookexternalhit|headless/i', $agent)) {
    echo '{"ok":true}';
    exit;
}

$raw = file_get_contents('php://input');
if (!is_string($raw) || strlen($raw) > 10000) {
    http_response_code(413);
    echo '{"ok":false}';
    exit;
}
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo '{"ok":false}';
    exit;
}

$allowedEvents = [
    'page_view', 'city_click', 'city_group_click', 'university_group_click',
    'event_click', 'newsletter_click', 'insurance_click', 'national_group_click',
    'candidate_group_click', 'next_city_click',
];
$event = analytics_text($data['event'] ?? '', 50);
if (!in_array($event, $allowedEvents, true)) {
    http_response_code(400);
    echo '{"ok":false}';
    exit;
}

$page = analytics_text($data['page'] ?? '/', 255);
if ($page === '' || $page[0] !== '/') {
    $page = '/';
}

try {
    $pdo = analytics_db();
    $visitor = analytics_client_hash();

    $rate = $pdo->prepare('SELECT COUNT(*) FROM analytics_events WHERE visitor_hash = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)');
    $rate->execute([$visitor]);
    if ((int) $rate->fetchColumn() >= 90) {
        http_response_code(429);
        echo '{"ok":false}';
        exit;
    }

    $insert = $pdo->prepare('INSERT INTO analytics_events
        (visitor_hash, event_name, page_path, city_slug, item_name, target_host, target_url, referrer_host, utm_source, utm_medium, utm_campaign, device_type)
        VALUES (?, ?, ?, NULLIF(?, ""), NULLIF(?, ""), NULLIF(?, ""), NULLIF(?, ""), NULLIF(?, ""), NULLIF(?, ""), NULLIF(?, ""), NULLIF(?, ""), ?)');
    $device = analytics_text($data['device'] ?? 'desktop', 20);
    if (!in_array($device, ['mobile', 'tablet', 'desktop'], true)) {
        $device = 'desktop';
    }
    $insert->execute([
        $visitor,
        $event,
        $page,
        analytics_text($data['city'] ?? '', 80),
        analytics_text($data['name'] ?? '', 190),
        analytics_host($data['target'] ?? ''),
        analytics_url($data['target'] ?? ''),
        analytics_host($data['referrer'] ?? ''),
        analytics_text($data['utm_source'] ?? '', 100),
        analytics_text($data['utm_medium'] ?? '', 100),
        analytics_text($data['utm_campaign'] ?? '', 150),
        $device,
    ]);

    if (random_int(1, 200) === 1) {
        $pdo->exec('DELETE FROM analytics_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 25 MONTH)');
        $pdo->exec('DELETE FROM analytics_login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 2 DAY)');
    }
    echo '{"ok":true}';
} catch (Throwable $error) {
    error_log('Analytics collect error: ' . $error->getMessage());
    http_response_code(500);
    echo '{"ok":false}';
}
