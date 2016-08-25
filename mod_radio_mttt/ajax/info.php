<?php
$address = $_POST['address'];

if(!$address)
	exit('{"error": "1"}');

exit(file_get_contents(urldecode($address)));