<?php

/**
 * @version		1.0
 * @package  	mod_radio_ml
 * @name		MTTT Visualizer
 * @author		MTTT Studio	http://www.mttt.ru
 *
 * @copyright   Copyright (C) MTTT Studio, 2015. All rights reserved.
 * @license		GNU/GPL license: http://www.gnu.org/copyleft/gpl.html
 */

defined('_JEXEC') or die;
$doc = JFactory::getDocument();
$doc->addStyleSheet('modules/mod_radio_visualizer/css/radio.css');
?>

<div id="radio_visualizer">
	<canvas id="radio_canvas" width="900px" height="120px"></canvas>
</div>
