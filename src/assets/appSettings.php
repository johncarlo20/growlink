<?php

$appSettings = [];
foreach ($_SERVER as $key => $value) {
    // only look for app settings that prefixed with NG_
    // NG_ denotes settings we want visible within our angular app
    if(preg_match('/^APPSETTING_NG_/', $key)) {
        $appSettings[str_replace('APPSETTING_NG_', '', $key)] = $value;
    }
}
header('Content-Type: application/json');
echo json_encode($appSettings);

?>
