<?php

require_once('../include/common.php');

define('_JEXEC', 1);
define('JPATH_BASE', dirUp(__FILE__, 4));
define('DS', DIRECTORY_SEPARATOR);

require_once(JPATH_BASE . DS . 'includes' . DS . 'defines.php');
require_once(JPATH_BASE . DS . 'includes' . DS . 'framework.php');

$siteapp = JFactory::getApplication('site');
$session = JFactory::getSession();

if(isset($_POST['station_id']))
	setcookie('radio_station_id', $_POST['station_id'], 0x7FFFFFFF, '/');

if(isset($_POST['autoplay']))
{
	$autoplay = $_POST['autoplay'];
	$session->set('radio_autoplay', $autoplay);
	die($autoplay == 1 ? "1" : "0");
}

if(isset($_POST['volume']))
	setcookie('radio_volume', $_POST['volume'], 0x7FFFFFFF, '/');
