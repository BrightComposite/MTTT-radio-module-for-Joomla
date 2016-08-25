<?php

function dirUp($file, $iterations = 1)
{
	if($iterations == 0)
		return $file;
		
	return dirUp(dirname($file), $iterations - 1);
}

function validateHttp($address)
{
	$address = strtr($address, '\\', '/');
	return 'http://'.$_SERVER['HTTP_HOST'].'/'.preg_replace('`'.$_SERVER['DOCUMENT_ROOT'].'`', "", $address);
}