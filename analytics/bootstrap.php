<?php
declare(strict_types=1);

date_default_timezone_set('Europe/Warsaw');

function analytics_config(): array
{
    static $config;
    if (is_array($config)) {
        return $config;
    }

    $path = __DIR__ . '/.analytics-config.php';
    if (!is_file($path)) {
        throw new RuntimeException('Brak konfiguracji analityki.');
    }

    $loaded = require $path;
    if (!is_array($loaded)) {
        throw new RuntimeException('Nieprawidłowa konfiguracja analityki.');
    }
    $config = $loaded;
    return $config;
}

function analytics_db(): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = analytics_config();
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']);
    $pdo = new PDO($dsn, $config['db_user'], $config['db_password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $offset = (new DateTimeImmutable())->format('P');
    $pdo->exec('SET time_zone = ' . $pdo->quote($offset));
    analytics_schema($pdo);
    return $pdo;
}

function analytics_schema(PDO $pdo): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS analytics_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        visitor_hash CHAR(64) NOT NULL,
        event_name VARCHAR(50) NOT NULL,
        page_path VARCHAR(255) NOT NULL,
        city_slug VARCHAR(80) NULL,
        item_name VARCHAR(190) NULL,
        target_host VARCHAR(190) NULL,
        target_url VARCHAR(500) NULL,
        referrer_host VARCHAR(190) NULL,
        utm_source VARCHAR(100) NULL,
        utm_medium VARCHAR(100) NULL,
        utm_campaign VARCHAR(150) NULL,
        device_type VARCHAR(20) NOT NULL DEFAULT 'desktop',
        PRIMARY KEY (id),
        KEY idx_created_at (created_at),
        KEY idx_event_created (event_name, created_at),
        KEY idx_visitor_created (visitor_hash, created_at),
        KEY idx_city_created (city_slug, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    if (!analytics_column_exists($pdo, 'analytics_events', 'target_url')) {
        $pdo->exec('ALTER TABLE analytics_events ADD COLUMN target_url VARCHAR(500) NULL AFTER target_host');
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS analytics_login_attempts (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        client_hash CHAR(64) NOT NULL,
        success TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        KEY idx_client_attempted (client_hash, attempted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $ready = true;
}

function analytics_column_exists(PDO $pdo, string $table, string $column): bool
{
    $statement = $pdo->prepare('SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?');
    $statement->execute([$table, $column]);
    return (int) $statement->fetchColumn() > 0;
}

function analytics_client_hash(string $scope = 'visitor'): string
{
    $config = analytics_config();
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $agent = substr($_SERVER['HTTP_USER_AGENT'] ?? 'unknown', 0, 250);
    $period = $scope === 'login' ? date('Y-m-d-H') : date('Y-m-d');
    return hash_hmac('sha256', $scope . '|' . $period . '|' . $ip . '|' . $agent, $config['hash_key']);
}

function analytics_security_headers(string $csp = "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header('Content-Security-Policy: ' . $csp);
    header('Cache-Control: no-store, private');
}

function analytics_text($value, int $maxLength): string
{
    if (!is_string($value)) {
        return '';
    }
    $value = trim(preg_replace('/[\x00-\x1F\x7F]/u', '', $value) ?? '');
    return mb_substr($value, 0, $maxLength, 'UTF-8');
}

function analytics_host($value): string
{
    $url = analytics_text($value, 500);
    if ($url === '') {
        return '';
    }
    $host = parse_url($url, PHP_URL_HOST);
    return is_string($host) ? mb_strtolower(mb_substr($host, 0, 190, 'UTF-8'), 'UTF-8') : '';
}

function analytics_url($value): string
{
    $url = analytics_text($value, 500);
    if ($url === '') {
        return '';
    }
    $parts = parse_url($url);
    if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
        return '';
    }
    $scheme = mb_strtolower((string) $parts['scheme'], 'UTF-8');
    if (!in_array($scheme, ['http', 'https'], true)) {
        return '';
    }
    $rebuilt = $scheme . '://' . mb_strtolower((string) $parts['host'], 'UTF-8');
    if (!empty($parts['path'])) {
        $rebuilt .= (string) $parts['path'];
    }
    if (!empty($parts['query'])) {
        $rebuilt .= '?' . (string) $parts['query'];
    }
    return mb_substr($rebuilt, 0, 500, 'UTF-8');
}

function analytics_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('sp_stats');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}
