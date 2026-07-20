<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
analytics_security_headers();
analytics_session_start();

$pdo = null;
$error = '';
try {
    $pdo = analytics_db();
} catch (Throwable $exception) {
    error_log('Analytics dashboard error: ' . $exception->getMessage());
    $error = 'Panel jest chwilowo niedostępny. Spróbuj ponownie za moment.';
}

if (!isset($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(24));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''))) {
    if (isset($_POST['logout'])) {
        $_SESSION = [];
        session_destroy();
        header('Location: ./');
        exit;
    }

    if (isset($_POST['password']) && $pdo instanceof PDO) {
        $client = analytics_client_hash('login');
        $check = $pdo->prepare('SELECT COUNT(*) FROM analytics_login_attempts WHERE client_hash = ? AND success = 0 AND attempted_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)');
        $check->execute([$client]);
        $blocked = (int) $check->fetchColumn() >= 10;
        $valid = !$blocked && password_verify((string) $_POST['password'], (string) analytics_config()['admin_password_hash']);
        $record = $pdo->prepare('INSERT INTO analytics_login_attempts (client_hash, success) VALUES (?, ?)');
        $record->execute([$client, $valid ? 1 : 0]);
        if ($valid) {
            session_regenerate_id(true);
            $_SESSION['authenticated'] = true;
            header('Location: ./');
            exit;
        }
        $error = $blocked ? 'Za dużo prób. Poczekaj 15 minut.' : 'Nieprawidłowe hasło.';
    }
}

$authenticated = !empty($_SESSION['authenticated']);

function h($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function analytics_rows(PDO $pdo, string $sql, array $params = []): array
{
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    return $statement->fetchAll();
}

function csv_safe(string $value): string
{
    return preg_match('/^[=+\-@]/', $value) ? "'" . $value : $value;
}

if ($authenticated && $pdo instanceof PDO) {
    $days = (int) ($_GET['days'] ?? 30);
    if (!in_array($days, [7, 30, 90, 365], true)) {
        $days = 30;
    }
    $since = date('Y-m-d H:i:s', time() - ($days * 86400));

    $summaryStatement = $pdo->prepare("SELECT
        SUM(event_name = 'page_view') AS views,
        COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN visitor_hash END) AS visitors,
        SUM(event_name <> 'page_view') AS clicks
        FROM analytics_events WHERE created_at >= ?");
    $summaryStatement->execute([$since]);
    $summary = $summaryStatement->fetch() ?: ['views' => 0, 'visitors' => 0, 'clicks' => 0];

    $events = analytics_rows($pdo, "SELECT event_name AS label, COUNT(*) AS total FROM analytics_events WHERE created_at >= ? AND event_name <> 'page_view' GROUP BY event_name ORDER BY total DESC", [$since]);
    $cities = analytics_rows($pdo, "SELECT city_slug AS label, COUNT(*) AS total FROM analytics_events WHERE created_at >= ? AND city_slug IS NOT NULL AND city_slug <> '' GROUP BY city_slug ORDER BY total DESC LIMIT 12", [$since]);
    $items = analytics_rows($pdo, "SELECT item_name AS label, COUNT(*) AS total FROM analytics_events WHERE created_at >= ? AND item_name IS NOT NULL AND item_name <> '' GROUP BY item_name ORDER BY total DESC LIMIT 12", [$since]);
    $sources = analytics_rows($pdo, "SELECT COALESCE(NULLIF(utm_source, ''), NULLIF(referrer_host, ''), 'wejście bezpośrednie') AS label, COUNT(*) AS total FROM analytics_events WHERE created_at >= ? AND event_name = 'page_view' GROUP BY label ORDER BY total DESC LIMIT 10", [$since]);
    $devices = analytics_rows($pdo, "SELECT device_type AS label, COUNT(*) AS total FROM analytics_events WHERE created_at >= ? AND event_name = 'page_view' GROUP BY device_type ORDER BY total DESC", [$since]);
    $daily = analytics_rows($pdo, "SELECT DATE(created_at) AS label, SUM(event_name = 'page_view') AS total FROM analytics_events WHERE created_at >= ? GROUP BY DATE(created_at) ORDER BY label", [$since]);

    if (isset($_GET['export']) && $_GET['export'] === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="statystyki-' . date('Y-m-d') . '.csv"');
        echo "\xEF\xBB\xBF";
        $output = fopen('php://output', 'wb');
        fputcsv($output, ['data', 'zdarzenie', 'miasto', 'element', 'strona', 'urządzenie'], ';');
        $export = analytics_rows($pdo, 'SELECT created_at, event_name, city_slug, item_name, page_path, device_type FROM analytics_events WHERE created_at >= ? ORDER BY created_at DESC LIMIT 50000', [$since]);
        foreach ($export as $row) {
            fputcsv($output, array_map(static fn($value) => csv_safe((string) $value), array_values($row)), ';');
        }
        fclose($output);
        exit;
    }
}

$eventLabels = [
    'city_click' => 'Kliknięcia w miasta',
    'city_group_click' => 'Główne grupy miejskie',
    'university_group_click' => 'Grupy uczelniane',
    'event_click' => 'Wydarzenia',
    'newsletter_click' => 'Newsletter',
    'insurance_click' => 'Ubezpieczenie',
    'national_group_click' => 'Studenci Polska',
    'candidate_group_click' => 'Kandydaci na studia',
    'next_city_click' => 'Następne miasto',
];
?><!doctype html>
<html lang="pl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex,nofollow,noarchive">
    <title>Statystyki — Studenci Polska</title>
    <link rel="stylesheet" href="panel.css">
</head>
<body>
<?php if (!$authenticated): ?>
    <main class="login-shell">
        <section class="login-card">
            <span class="logo">SP</span>
            <p class="eyebrow">PRYWATNY PANEL</p>
            <h1>Statystyki<br><em>Studenci Polska.</em></h1>
            <p class="muted">Zaloguj się hasłem administratora.</p>
            <?php if ($error !== ''): ?><p class="error"><?= h($error) ?></p><?php endif; ?>
            <form method="post" autocomplete="off">
                <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
                <label for="password">Hasło</label>
                <input id="password" name="password" type="password" required autofocus autocomplete="current-password">
                <button type="submit">Otwórz panel <span>→</span></button>
            </form>
        </section>
    </main>
<?php else: ?>
    <header class="topbar">
        <a class="brand" href="./"><span>SP</span><b>statystyki</b></a>
        <nav class="ranges">
            <?php foreach ([7, 30, 90, 365] as $range): ?><a class="<?= $days === $range ? 'active' : '' ?>" href="?days=<?= $range ?>"><?= $range === 365 ? 'rok' : $range . ' dni' ?></a><?php endforeach; ?>
        </nav>
        <a class="export" href="?days=<?= $days ?>&amp;export=csv">Pobierz CSV</a>
        <form method="post"><input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>"><button class="logout" name="logout" value="1">Wyloguj</button></form>
    </header>
    <main class="dashboard">
        <section class="welcome">
            <div><p class="eyebrow">OSTATNIE <?= $days === 365 ? '12 MIESIĘCY' : $days . ' DNI' ?></p><h1>Co dzieje się<br><em>na stronie?</em></h1></div>
            <p>Dane są zbiorcze i prywatne. Nie zapisujemy pełnych adresów IP ani danych osobowych odwiedzających.</p>
        </section>
        <section class="metrics">
            <article><span>01</span><strong><?= number_format((int) $summary['views'], 0, ',', ' ') ?></strong><p>odsłon</p></article>
            <article><span>02</span><strong><?= number_format((int) $summary['visitors'], 0, ',', ' ') ?></strong><p>odwiedzających*</p></article>
            <article><span>03</span><strong><?= number_format((int) $summary['clicks'], 0, ',', ' ') ?></strong><p>kliknięć</p></article>
        </section>
        <p class="note">* Szacunkowa liczba unikalnych osób w poszczególnych dniach, bez trwałego śledzenia użytkowników.</p>
        <section class="panel wide">
            <div class="panel-title"><div><p class="eyebrow">RUCH NA STRONIE</p><h2>Odsłony dzienne</h2></div></div>
            <div class="timeline">
            <?php $dailyMax = max(1, ...array_map(static fn($r) => (int) $r['total'], $daily)); foreach ($daily as $row): ?>
                <div title="<?= h($row['label']) ?>: <?= (int) $row['total'] ?>"><i style="height:<?= max(3, (int) round(((int) $row['total'] / $dailyMax) * 100)) ?>%"></i><small><?= h(substr($row['label'], 5)) ?></small></div>
            <?php endforeach; ?>
            <?php if (!$daily): ?><p class="empty">Dane pojawią się po pierwszych wejściach.</p><?php endif; ?>
            </div>
        </section>
        <section class="panel-grid">
            <?php
            $sections = [
                ['Najczęstsze działania', $events, $eventLabels],
                ['Najpopularniejsze miasta', $cities, []],
                ['Najczęściej klikane elementy', $items, []],
                ['Źródła wejść', $sources, []],
                ['Urządzenia', $devices, ['mobile' => 'Telefon', 'tablet' => 'Tablet', 'desktop' => 'Komputer']],
            ];
            foreach ($sections as [$title, $rows, $labels]): $max = max(1, ...array_map(static fn($r) => (int) $r['total'], $rows)); ?>
            <section class="panel">
                <div class="panel-title"><h2><?= h($title) ?></h2></div>
                <div class="ranking">
                    <?php foreach ($rows as $index => $row): $label = $labels[$row['label']] ?? str_replace('-', ' ', (string) $row['label']); ?>
                    <div class="rank"><span><?= str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) ?></span><div><p><b><?= h($label) ?></b><strong><?= (int) $row['total'] ?></strong></p><i style="width:<?= max(2, (int) round(((int) $row['total'] / $max) * 100)) ?>%"></i></div></div>
                    <?php endforeach; ?>
                    <?php if (!$rows): ?><p class="empty">Jeszcze brak danych.</p><?php endif; ?>
                </div>
            </section>
            <?php endforeach; ?>
        </section>
    </main>
<?php endif; ?>
</body>
</html>
