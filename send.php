<?php
// send.php — безопасная отправка лидов в Telegram (SpaceWeb / обычный PHP-хостинг)

header('Content-Type: application/json; charset=utf-8');

$BOT_TOKEN = '7901882156:AAGQN7tnpgffxDq5IebERY-qqVIC-sJ_xp0';
$CHAT_ID   = '-1003273770478';

// --- helpers ---
function readJsonBody(): array {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function postJson(string $url, array $payload): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 20,
  ]);
  $resp = curl_exec($ch);
  $err  = curl_error($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($resp === false) return ['ok' => false, 'error' => 'cURL error: '.$err];

  $decoded = json_decode($resp, true);
  if (!is_array($decoded)) $decoded = ['ok' => false, 'error' => 'Bad Telegram response', 'raw' => $resp];
  $decoded['http_code'] = $code;
  return $decoded;
}

function logLine(string $line): void {
  // лог рядом с send.php
  file_put_contents(__DIR__ . '/send.log', date('c').' '.$line.PHP_EOL, FILE_APPEND);
}

// --- минимальная проверка только на ПУСТОТУ (без сравнения со “заглушками”) ---
if (!$BOT_TOKEN) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'BOT_TOKEN empty'], JSON_UNESCAPED_UNICODE); exit; }
if (!$CHAT_ID)   { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'CHAT_ID empty'], JSON_UNESCAPED_UNICODE); exit; }

// --- TEST режим: /send.php?test=1 ---
if (isset($_GET['test']) && $_GET['test'] == '1') {
  $tgUrl = "https://api.telegram.org/bot{$BOT_TOKEN}/sendMessage";
  $payload = [
    'chat_id' => $CHAT_ID,
    'text' => "✅ TEST: send.php работает. Домен: ".($_SERVER['HTTP_HOST'] ?? 'unknown'),
    'parse_mode' => 'HTML',
    'disable_web_page_preview' => true,
  ];
  $result = postJson($tgUrl, $payload);
  logLine('TEST result: '.json_encode($result, JSON_UNESCAPED_UNICODE));
  if (!($result['ok'] ?? false)) { http_response_code(502); echo json_encode(['ok'=>false,'error'=>'Telegram error','tg'=>$result], JSON_UNESCAPED_UNICODE); exit; }
  echo json_encode(['ok'=>true,'mode'=>'test'], JSON_UNESCAPED_UNICODE);
  exit;
}

// --- input: JSON или POST-форма ---
$json = readJsonBody();

$text = $json['text'] ?? null;
$parse_mode = $json['parse_mode'] ?? 'HTML';
$page = $json['page'] ?? ($_SERVER['HTTP_REFERER'] ?? '');

if ($text === null) {
  // form-data fallback
  $name     = $_POST['name'] ?? '';
  $phone    = $_POST['phone'] ?? '';
  $email    = $_POST['email'] ?? '';
  $company  = $_POST['company'] ?? '';
  $volume   = $_POST['volume'] ?? '';
  $region   = $_POST['region'] ?? '';
  $deadline = $_POST['deadline'] ?? '';
  $comment  = $_POST['comment'] ?? '';
  $page     = $page ?: ($_POST['page'] ?? '');

  $text = "🎯 <b>НОВАЯ ЗАЯВКА С САЙТА</b>\n\n"
        . "👤 <b>Имя:</b> ".htmlspecialchars($name)."\n"
        . "📱 <b>Телефон:</b> ".htmlspecialchars($phone)."\n"
        . "📧 <b>Email:</b> ".htmlspecialchars($email ?: 'не указан')."\n"
        . "🏢 <b>Компания:</b> ".htmlspecialchars($company ?: 'не указана')."\n\n"
        . "📦 <b>Объём:</b> ".htmlspecialchars($volume)." тонн\n"
        . "📍 <b>Регион:</b> ".htmlspecialchars($region)."\n"
        . "⏰ <b>Срок:</b> ".htmlspecialchars($deadline ?: 'не указан')."\n"
        . "💬 <b>Комментарий:</b> ".htmlspecialchars($comment ?: 'нет')."\n"
        . ($page ? ("\n🌐 <b>Страница:</b> ".htmlspecialchars($page)."\n") : "");
}

if (!$text || !is_string($text)) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'Empty text'], JSON_UNESCAPED_UNICODE);
  exit;
}

$tgUrl = "https://api.telegram.org/bot{$BOT_TOKEN}/sendMessage";
$payload = [
  'chat_id' => $CHAT_ID,
  'text' => $text,
  'parse_mode' => $parse_mode,
  'disable_web_page_preview' => true,
];

$result = postJson($tgUrl, $payload);
logLine('SEND result: '.json_encode($result, JSON_UNESCAPED_UNICODE));

if (!($result['ok'] ?? false)) {
  http_response_code(502);
  echo json_encode(['ok'=>false,'error'=>($result['description'] ?? 'Telegram error'),'tg'=>$result], JSON_UNESCAPED_UNICODE);
  exit;
}

echo json_encode(['ok'=>true], JSON_UNESCAPED_UNICODE);