<?php

require_once('../include/common.php');

define('_JEXEC', 1);
define('JPATH_BASE', dirUp(__FILE__, 4));
define('DS', DIRECTORY_SEPARATOR);

require_once(JPATH_BASE . DS . 'includes' . DS . 'defines.php');
require_once(JPATH_BASE . DS . 'includes' . DS . 'framework.php');

$siteapp = JFactory::getApplication('site');
$session = JFactory::getSession();

if(isset($_POST['quality']))
	setcookie('radio_quality', $_POST['quality'], 0x7FFFFFFF, '/');

if(isset($_POST['provider_id']))
	setcookie('radio_provider', $_POST['provider_id'], 0x7FFFFFFF, '/');
