<?php

/**
 * @version		1.0
 * @package  	mod_radio_ml
 * @name		Monologic Radio
 * @author		Monologic Studio	http://www.monologic.ru
 *
 * @copyright   Copyright (C) Monologic Studio, 2015. All rights reserved.
 * @license		GNU/GPL license: http://www.gnu.org/copyleft/gpl.html
 */

defined('_JEXEC') or die;

$session = JFactory::getSession();

$autoplay = $session->get('radio_autoplay', "0");

if(!isset($_COOKIE['radio_station_id']))
{
	$station_id = "dance";
	
	setcookie('radio_station_id', $station_id, 0x7FFFFFFF, '/');
	$_COOKIE['radio_station_id'] = $station_id;
}
else
	$station_id = $_COOKIE['radio_station_id'];
	
if(!isset($_COOKIE['radio_provider']))
	$provider_id = "";
else
	$provider_id = $_COOKIE['radio_provider'];
	
if(!isset($_COOKIE['radio_quality']))
	$quality = "good";
else
	$quality = $_COOKIE['radio_quality'];
	
$volume = isset($_COOKIE['radio_volume']) ? $_COOKIE['radio_volume'] : "0.5";

$doc = JFactory::getDocument();
$doc->addScript('modules/mod_radio_mttt/js/radio.js');
$doc->addStyleSheet('modules/mod_radio_mttt/css/radio.css');

require_once 'include/common.php';
?>

<div id="text_wrapper">
	<div id="player_text"></div>
</div>

<div class="centralizer">
	<div class="vertical">
		<div id="slider" title="Громкость">
			<canvas id="slider-canvas" width="20px" height="38px"></canvas>
		</div>
	</div>
	
	<div id="play_pause"	class="player-main"		title="Воспроизведение"></div>
	
	<div id="prev_station"	class="player-back"		title="Предыдущая станция"></div>
	<div class="station" title="Текущая станция"><span id="station_name"></span></div>
	<div id="next_station"	class="player-forward"	title="Следующая станция"></div>
	
	<div id="menu"          class="player-settings" title="Настройки плеера"></div>
</div>

<div class="hidden">
	<div id="radio_menu">
		<div class="title">Настройки</div>
		
		<div class="options_list provider">
			<center><div class="element">Провайдер</div></center>
		</div>
		
		<div class="options_list quality">
			<center><div class="element">Качество соединения</div></center>
		</div>
		
		<div class="options_list action">
			<div class="option action" id="o_save">Сохранить</div>
			<div class="option action" id="o_cancel">Отмена</div>
		</div>
	</div>
</div>

<audio id="audio" src="http://kamchatkalive.ru/radio/kamchatka_live" preload="auto"></audio>

<input type="hidden" id="root" value="<?php echo JUri::root();?>" >

<input type="hidden" id="station_id" value="<?php echo $station_id;?>" >
<input type="hidden" id="provider_id" value="<?php echo $provider_id;?>" >
<input type="hidden" id="quality" value="<?php echo $quality;?>" >

<input type="hidden" id="autoplay" value="<?php echo $autoplay;?>" >
<input type="hidden" id="volume" value="<?php echo $volume;?>" >
