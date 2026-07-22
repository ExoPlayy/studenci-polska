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

function dashboard_url(array $changes = []): string
{
    $query = array_merge([
        'days' => (int) ($_GET['days'] ?? 30),
        'city' => (string) ($_GET['city'] ?? ''),
        'kind' => (string) ($_GET['kind'] ?? 'all'),
    ], $changes);
    $query = array_filter($query, static fn($value) => $value !== '' && $value !== 'all');
    return '?' . http_build_query($query);
}

if ($authenticated && $pdo instanceof PDO) {
    $days = (int) ($_GET['days'] ?? 30);
    if (!in_array($days, [7, 30, 90, 365], true)) {
        $days = 30;
    }
    $since = date('Y-m-d H:i:s', time() - ($days * 86400));

    $cityOptions = analytics_rows($pdo, "SELECT city_slug AS value, COUNT(*) AS total FROM analytics_events WHERE city_slug IS NOT NULL AND city_slug <> '' GROUP BY city_slug ORDER BY city_slug");
    $allowedCities = array_column($cityOptions, 'value');
    $selectedCity = (string) ($_GET['city'] ?? '');
    if ($selectedCity !== '' && !in_array($selectedCity, $allowedCities, true)) {
        $selectedCity = '';
    }

    $kindEvents = [
        'universities' => ['university_group_click'],
        'events' => ['event_click'],
        'city-groups' => ['city_group_click'],
        'city-tiles' => ['city_click'],
        'other' => ['newsletter_click', 'insurance_click', 'national_group_click', 'candidate_group_click', 'next_city_click'],
    ];
    $selectedKind = (string) ($_GET['kind'] ?? 'all');
    if ($selectedKind !== 'all' && !isset($kindEvents[$selectedKind])) {
        $selectedKind = 'all';
    }

    $where = 'created_at >= ?';
    $params = [$since];
    if ($selectedCity !== '') {
        $where .= ' AND city_slug = ?';
        $params[] = $selectedCity;
    }
    if ($selectedKind !== 'all') {
        $placeholders = implode(',', array_fill(0, count($kindEvents[$selectedKind]), '?'));
        $where .= " AND event_name IN ($placeholders)";
        array_push($params, ...$kindEvents[$selectedKind]);
    }

    $summaryStatement = $pdo->prepare("SELECT
        SUM(event_name = 'page_view') AS views,
        COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN visitor_hash END) AS visitors,
        SUM(event_name <> 'page_view') AS clicks
        FROM analytics_events WHERE $where");
    $summaryStatement->execute($params);
    $summary = $summaryStatement->fetch() ?: ['views' => 0, 'visitors' => 0, 'clicks' => 0];

    $events = analytics_rows($pdo, "SELECT event_name AS label, COUNT(*) AS total FROM analytics_events WHERE $where AND event_name <> 'page_view' GROUP BY event_name ORDER BY total DESC", $params);
    $cities = analytics_rows($pdo, "SELECT city_slug AS label, COUNT(*) AS total FROM analytics_events WHERE $where AND city_slug IS NOT NULL AND city_slug <> '' GROUP BY city_slug ORDER BY total DESC LIMIT 20", $params);
    $sources = analytics_rows($pdo, "SELECT COALESCE(NULLIF(utm_source, ''), NULLIF(referrer_host, ''), 'wejście bezpośrednie') AS label, COUNT(*) AS total FROM analytics_events WHERE $where AND event_name = 'page_view' GROUP BY label ORDER BY total DESC LIMIT 10", $params);
    $devices = analytics_rows($pdo, "SELECT device_type AS label, COUNT(*) AS total FROM analytics_events WHERE $where AND event_name = 'page_view' GROUP BY device_type ORDER BY total DESC", $params);
    $dailyMetric = $selectedKind === 'all' ? "SUM(event_name = 'page_view')" : 'COUNT(*)';
    $daily = analytics_rows($pdo, "SELECT DATE(created_at) AS label, $dailyMetric AS total FROM analytics_events WHERE $where GROUP BY DATE(created_at) ORDER BY label", $params);

    $detailLists = [];
    foreach ([
        'Klikane grupy uczelniane' => 'university_group_click',
        'Klikane imprezy studenckie' => 'event_click',
        'Główne grupy miejskie' => 'city_group_click',
        'Kafelki miast' => 'city_click',
    ] as $title => $eventName) {
        $detailLists[$title] = analytics_rows($pdo, "SELECT COALESCE(NULLIF(item_name, ''), NULLIF(city_slug, ''), 'Bez nazwy') AS label, city_slug, MAX(target_url) AS target_url, MAX(target_host) AS target_host, COUNT(*) AS total FROM analytics_events WHERE $where AND event_name = ? GROUP BY label, city_slug ORDER BY total DESC LIMIT 50", array_merge($params, [$eventName]));
    }
    $otherButtons = analytics_rows($pdo, "SELECT event_name AS label, COUNT(*) AS total FROM analytics_events WHERE $where AND event_name IN ('newsletter_click','insurance_click','national_group_click','candidate_group_click','next_city_click') GROUP BY event_name ORDER BY total DESC", $params);
    $recentClicks = analytics_rows($pdo, "SELECT created_at, event_name, city_slug, item_name, target_url, target_host FROM analytics_events WHERE $where AND event_name <> 'page_view' ORDER BY created_at DESC LIMIT 30", $params);

    if (isset($_GET['export']) && $_GET['export'] === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="statystyki-' . date('Y-m-d') . '.csv"');
        echo "\xEF\xBB\xBF";
        $output = fopen('php://output', 'wb');
        fputcsv($output, ['data', 'zdarzenie', 'miasto', 'element', 'klikniety_link', 'strona', 'urządzenie'], ';');
        $export = analytics_rows($pdo, "SELECT created_at, event_name, city_slug, item_name, target_url, page_path, device_type FROM analytics_events WHERE $where ORDER BY created_at DESC LIMIT 50000", $params);
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
    <link rel="stylesheet" href="panel-extra.css">
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
            <?php foreach ([7, 30, 90, 365] as $range): ?><a class="<?= $days === $range ? 'active' : '' ?>" href="<?= h(dashboard_url(['days' => $range])) ?>"><?= $range === 365 ? 'rok' : $range . ' dni' ?></a><?php endforeach; ?>
        </nav>
        <a class="export" href="<?= h(dashboard_url(['export' => 'csv'])) ?>">Pobierz CSV</a>
        <form method="post"><input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>"><button class="logout" name="logout" value="1">Wyloguj</button></form>
    </header>
    <main class="dashboard">
        <section class="welcome">
            <div><p class="eyebrow">OSTATNIE <?= $days === 365 ? '12 MIESIĘCY' : $days . ' DNI' ?></p><h1>Co dzieje się<br><em>na stronie?</em></h1></div>
            <p>Dane są zbiorcze i prywatne. Nie zapisujemy pełnych adresów IP ani danych osobowych odwiedzających.</p>
        </section>
        <form class="dashboard-filters" method="get">
            <label><span>Okres</span><select name="days">
                <?php foreach ([7, 30, 90, 365] as $range): ?><option value="<?= $range ?>" <?= $days === $range ? 'selected' : '' ?>><?= $range === 365 ? 'Ostatni rok' : 'Ostatnie ' . $range . ' dni' ?></option><?php endforeach; ?>
            </select></label>
            <label><span>Miasto</span><select name="city">
                <option value="">Wszystkie miasta</option>
                <?php foreach ($cityOptions as $option): ?><option value="<?= h($option['value']) ?>" <?= $selectedCity === $option['value'] ? 'selected' : '' ?>><?= h(ucfirst(str_replace('-', ' ', (string) $option['value']))) ?> (<?= (int) $option['total'] ?>)</option><?php endforeach; ?>
            </select></label>
            <label><span>Rodzaj danych</span><select name="kind">
                <?php foreach (['all' => 'Wszystkie dane', 'universities' => 'Grupy uczelniane', 'events' => 'Imprezy', 'city-groups' => 'Grupy miejskie', 'city-tiles' => 'Kafelki miast', 'other' => 'Pozostałe przyciski'] as $value => $label): ?><option value="<?= h($value) ?>" <?= $selectedKind === $value ? 'selected' : '' ?>><?= h($label) ?></option><?php endforeach; ?>
            </select></label>
            <button type="submit">Pokaż dane <span>→</span></button>
            <?php if ($selectedCity !== '' || $selectedKind !== 'all'): ?><a href="?days=<?= $days ?>">Wyczyść filtry</a><?php endif; ?>
        </form>
        <?php if ($selectedCity !== '' || $selectedKind !== 'all'): ?>
        <p class="filter-summary">Aktywny widok: <b><?= $selectedCity !== '' ? h(ucfirst(str_replace('-', ' ', $selectedCity))) : 'wszystkie miasta' ?></b> · <b><?= h(['all' => 'wszystkie dane', 'universities' => 'grupy uczelniane', 'events' => 'imprezy', 'city-groups' => 'grupy miejskie', 'city-tiles' => 'kafelki miast', 'other' => 'pozostałe przyciski'][$selectedKind]) ?></b></p>
        <?php endif; ?>
        <section class="metrics">
            <article><span>01</span><strong><?= number_format((int) $summary['views'], 0, ',', ' ') ?></strong><p>odsłon</p></article>
            <article><span>02</span><strong><?= number_format((int) $summary['visitors'], 0, ',', ' ') ?></strong><p>odwiedzających*</p></article>
            <article><span>03</span><strong><?= number_format((int) $summary['clicks'], 0, ',', ' ') ?></strong><p>kliknięć</p></article>
        </section>
        <p class="note">* Szacunkowa liczba unikalnych osób w poszczególnych dniach, bez trwałego śledzenia użytkowników.</p>
        <section class="panel wide">
            <div class="panel-title"><div><p class="eyebrow">RUCH NA STRONIE</p><h2><?= $selectedKind === 'all' ? 'Odsłony dzienne' : 'Kliknięcia dzienne' ?></h2></div></div>
            <div class="timeline">
            <?php $dailyMax = max(1, ...array_map(static fn($r) => (int) $r['total'], $daily)); foreach ($daily as $row): ?>
                <div title="<?= h($row['label']) ?>: <?= (int) $row['total'] ?>"><i style="height:<?= max(3, (int) round(((int) $row['total'] / $dailyMax) * 100)) ?>%"></i><small><?= h(substr($row['label'], 5)) ?></small></div>
            <?php endforeach; ?>
            <?php if (!$daily): ?><p class="empty">Dane pojawią się po pierwszych wejściach.</p><?php endif; ?>
            </div>
        </section>
        <div class="section-heading"><p class="eyebrow">SZCZEGÓŁY KLIKNIĘĆ</p><h2>Co dokładnie wybierają odwiedzający?</h2><p>Każdy ranking reaguje na wybrany okres, miasto i rodzaj danych.</p></div>
        <section class="panel-grid detail-grid">
            <?php foreach ($detailLists as $title => $rows): $max = max(1, ...array_map(static fn($r) => (int) $r['total'], $rows)); ?>
            <section class="panel">
                <div class="panel-title"><h2><?= h($title) ?></h2><span class="panel-total"><?= array_sum(array_map(static fn($r) => (int) $r['total'], $rows)) ?> kliknięć</span></div>
                <div class="ranking">
                    <?php foreach ($rows as $index => $row): ?>
                    <div class="rank"><span><?= str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) ?></span><div><p><b title="<?= h($row['label']) ?>"><?= h($row['label']) ?></b><strong><?= (int) $row['total'] ?></strong></p><?php if (!empty($row['city_slug'])): ?><small><?= h(ucfirst(str_replace('-', ' ', (string) $row['city_slug']))) ?></small><?php endif; ?><?php if (!empty($row['target_url'])): ?><small class="target-url"><a href="<?= h($row['target_url']) ?>" target="_blank" rel="noopener noreferrer"><?= h($row['target_host'] ?: $row['target_url']) ?></a></small><?php endif; ?><i style="width:<?= max(2, (int) round(((int) $row['total'] / $max) * 100)) ?>%"></i></div></div>
                    <?php endforeach; ?>
                    <?php if (!$rows): ?><p class="empty">Brak takich kliknięć dla wybranych filtrów.</p><?php endif; ?>
                </div>
            </section>
            <?php endforeach; ?>
            <section class="panel">
                <div class="panel-title"><h2>Pozostałe przyciski</h2></div>
                <div class="ranking">
                    <?php $otherMax = max(1, ...array_map(static fn($r) => (int) $r['total'], $otherButtons)); foreach ($otherButtons as $index => $row): ?>
                    <div class="rank"><span><?= str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) ?></span><div><p><b><?= h($eventLabels[$row['label']] ?? $row['label']) ?></b><strong><?= (int) $row['total'] ?></strong></p><i style="width:<?= max(2, (int) round(((int) $row['total'] / $otherMax) * 100)) ?>%"></i></div></div>
                    <?php endforeach; ?>
                    <?php if (!$otherButtons): ?><p class="empty">Brak takich kliknięć dla wybranych filtrów.</p><?php endif; ?>
                </div>
            </section>
        </section>
        <section class="panel wide recent-panel">
            <div class="panel-title"><div><p class="eyebrow">NAJNOWSZE DANE</p><h2>Ostatnie kliknięcia</h2></div></div>
            <div class="recent-table">
                <div class="recent-head"><span>Czas</span><span>Rodzaj</span><span>Miasto</span><span>Element i link</span></div>
                <?php foreach ($recentClicks as $row): ?><div class="recent-row"><time><?= h(date('d.m H:i', strtotime((string) $row['created_at']))) ?></time><span><?= h($eventLabels[$row['event_name']] ?? $row['event_name']) ?></span><span><?= h($row['city_slug'] ? ucfirst(str_replace('-', ' ', (string) $row['city_slug'])) : '—') ?></span><b title="<?= h(($row['item_name'] ?? '') . ' ' . ($row['target_url'] ?? '')) ?>"><?= h($row['item_name'] ?: '—') ?><?php if (!empty($row['target_url'])): ?><small><a href="<?= h($row['target_url']) ?>" target="_blank" rel="noopener noreferrer"><?= h($row['target_host'] ?: $row['target_url']) ?></a></small><?php endif; ?></b></div><?php endforeach; ?>
                <?php if (!$recentClicks): ?><p class="empty">Brak kliknięć dla wybranych filtrów.</p><?php endif; ?>
            </div>
        </section>
        <section class="panel-grid">
            <?php
            $sections = [
                ['Najczęstsze działania', $events, $eventLabels],
                ['Najpopularniejsze miasta', $cities, []],
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
