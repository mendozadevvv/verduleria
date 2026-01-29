<?php
// index.php — simple device router
// Force view with ?view=pc or ?view=mobile (useful for testing)
$view = isset($_GET['view']) ? strtolower($_GET['view']) : '';

function is_mobile_ua(string $ua): bool {
  return preg_match('/android|iphone|ipod|ipad|iemobile|blackberry|opera mini|mobile|webos/i', $ua) === 1;
}

if ($view === 'pc') {
  header('Location: /pc/');
  exit;
}
if ($view === 'mobile') {
  header('Location: /mobile/');
  exit;
}

$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if (is_mobile_ua($ua)) {
  header('Location: /mobile/');
} else {
  header('Location: /pc/');
}
exit;
?>
