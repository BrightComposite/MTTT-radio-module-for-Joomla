
/**
 * @version		1.0
 * @package  	mod_radio_mttt
 * @subpackage  radio.js
 * @name		MTTT Radio
 * @author		MTTT Studio	http://www.monologic.ru
 *
 * @copyright   Copyright (C) MTTT Studio, 2015. All rights reserved.
 * @license		GNU/GPL license: http://www.gnu.org/copyleft/gpl.html
 */


if(!Object.create)
{
	Object.create = function(proto)
	{
		function F() {}
		F.prototype = proto;
		return new F;
	};
}

CanvasRenderingContext2D.prototype.fillRoundRect = function (x, y, w, h, r)
{
	if (w < 2 * r) r = w / 2;
	if (h < 2 * r) r = h / 2;

	this.beginPath();
	this.moveTo(x + r, y);

	this.arcTo(x + w, 	y,   	x + w,	y + h,	r);
	this.arcTo(x + w, 	y + h,	x,		y + h,	r);
	this.arcTo(x,		y + h,	x,		y,		r);
	this.arcTo(x,   	y,   	x + w,	y,		r);

	this.fill();
}

function hsv(color)
{
    var
    	r, g, b, i, f, p, q, t,
    	h = color.h, s = (color.s === undefined) ? 1.0 : color.s, v = (color.v === undefined) ? 1.0 : color.v;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch(i % 6)
    {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return "rgb(" +
        Math.floor(r * 255) + ", " +
        Math.floor(g * 255) + ", " +
        Math.floor(b * 255) +
    ")";
}

var
    SMOOTHING = 0.3,
    EQ_BARS_WIDTH = 12,
    EQ_BARS_SCALE = 20,
	EQ_BACK_SCALE = 1.4,
	MAX_STRING_WIDTH = 60,
	BIG_STRING_WIDTH = 20;

var w = window,
    d = document,
	player = null,
	slider = null,
	darkness = null,

    browser = (function()
    {
        var
        	ua = navigator.userAgent,
        	tem,
        	info = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

        if(/trident/i.test(info[1]))
        {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return {name: 'IE', version: tem[1] || ''};
        }

        if(info[1] === 'Chrome')
        {
            tem = ua.match(/\bOPR\/(\d+)/);

            if(tem != null)
                return {name: 'Opera', version: tem[1]};
        }

        info = info[2] ? [info[1], info[2]]: [navigator.appName, navigator.appVersion, '-?'];

        tem = ua.match(/version\/(\d+)/i);

        if(tem != null)
        	info.splice(1, 1, tem[1]);

        return {name: info[0], version: info[1]};
    })(),

	providers = [
		{
			key: "sktv",
			caption: "СКТВ",
			address: "http://kamchatkalive.ru/radio/" // ВОТ ЗДЕСЬ НУЖНО ИСПРАВИТЬ, ЧТОБ ВРУБИТЬ БЕСПЛАТНЫЙ ДОСТУП СКТВШНИКАМ
			//address: "http://78.157.230.152:8001/"
		},
		{
			key: "ros",
			caption: "Ростелеком",
			address: "http://kamchatkalive.ru/radio/",
		},
		{
			key: "mts",
			caption: "МТС",
			address: "http://kamchatkalive.ru/radio/",
		},
		{
			key: "iks",
			caption: "ИнтерКамСервис",
			address: "http://kamchatkalive.ru/radio/",
		},
		{
			key: "local",
			caption: "Локальная сеть СКТВ",
			address: "http://localhost/radio/"
		}
	],

	qualities = [
		{
			key: "good",
			caption: "Хорошее"
		},
		{
			key: "bad",
			caption: "Плохое",
		}
	],
	enable_pseudo = true, // изменить НА false для того, чтобы ПЕРЕСТАТЬ НАКРУЧИВАТЬ СЛУШАТЕЛЕЙ :)

	stations = [
		{
			key: "dance",
			server_name: "Kamchatka LIVE Dance",
			name: "Dance",
			normal: "kamchatka_live",
			slow: "dance_aac48",
			a: 4,
			b: 9
		},
		{
			key: "rock",
			server_name: "Radio KamchatkaLive Rock",
			name: "Rock",
			normal: "rock",
			slow: "rock_aac48",
			a: 6,
			b: 7
		},
		{
			key: "rap",
			server_name: "Kamchatka LIVE RAP",
			name: "Rap",
			normal: "rap",
			slow: "rap_aac48",
			a: 4,
			b: 3
		},
		{
			key: "chill",
			server_name: "Kamchatka LIVE Chill Out",
			name: "Chillout",
			normal: "chillout",
			slow: "chillout_aac48",
			a: 3,
			b: 10
		},
		{
			key: "fallout",
			server_name: "Fallout Radio",
			name: "Fallout",
			normal: "fallout",
			slow: "fallout",
			a: 1,
			b: 1
		}
	],
	isMobile = {
		Android: function() {
			return navigator.userAgent.match(/Android/i);
		},
		BlackBerry: function() {
			return navigator.userAgent.match(/BlackBerry/i);
		},
		iOS: function() {
			return navigator.userAgent.match(/iPhone|iPad|iPod/i);
		},
		Opera: function() {
			return navigator.userAgent.match(/Opera Mini/i);
		},
		Windows: function() {
			return navigator.userAgent.match(/IEMobile/i);
		},
		Any: function() {
			return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
		}
	},
	mobile = isMobile.Any(),
	AudioCtx,
	localStreamInfo = "http://172.25.90.254:8000/status-json.xsl",
	streamInfo = "http://kamchatkalive.ru/radio/status-json.xsl",
	streamInfoText = '<span style="color: #d80; margin-right: 7px;">Сейчас в эфире: </span>',
	streamListenText = '<span style="color: #d80; margin-right: 7px;">Cлушают: </span>',
	volumeFade = 0,
	volumeFadeState = 0,  // 0 - unactive, 1 - fading on, 2 - fading out
	volumeFadeSpeed = 0.1, // delta per tick
	volumeFadePeriod = 400; // tick duration, ms

	function findProvider(key)
	{
		for(var i = 0; i < providers.length; ++i)
		{
			var provider = providers[i];

			if(provider.key === key)
				return provider;
		}

		return null;
	}

	function findStation(key)
	{
		for(var i = 0; i < stations.length; ++i)
		{
			var station = stations[i];

			if(station.key === key)
				return station;
		}

		return null;
	}

//	class Visualizer
//	{
		function Visualizer(player)
		{
			this.player = player;
			this.ctx = player.canvasContext;
			this.canvas = player.canvas;
			this.bars = [];
			this.barsCount = 0;
			this.dataSize = 0;
		}

		Visualizer.prototype.animate = function ()
		{
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		};
//	}

//	class EqualizerBar
//	{
		function calcV(index, count, offset)
		{
			return 1.0 - Math.abs(1.0 - 2 * (offset + index) / (count - 1 + offset)) * 1.2 + 0.6;
		}

		function EqualizerBar(owner, i)
		{
			this.owner = owner;
			this.scale = 0.5;
			this.h = 0.5;
			this.level = 0.0;
			this.colorh = 0.1;//i / (this.owner.barsCount - 1);
			this.colorv = calcV(i, this.owner.barsCount, 10);
		};

		EqualizerBar.prototype.draw = function(ctx, x, y, i)
		{
			var height = ctx.canvas.height * this.scale * 0.8;
			this.level = Math.max(this.level - 0.5, height);

			ctx.save();
			ctx.fillStyle = hsv({h: this.colorh, s: 1.0, v: this.scale * this.colorv * 0.8});
			ctx.fillRect(x, y - height - 2, this.owner.barsWidth, height + 2);
			ctx.fillRect(x, y - this.level - 4, this.owner.barsWidth, 3);

			ctx.fillStyle = hsv({h: this.colorh, s: 1.0, v: this.colorv});
			ctx.fillRect(x + 1, y - this.level - 3, this.owner.barsWidth - 2, 1);
			ctx.fillRect(x + 2, y - height, this.owner.barsWidth - 4, height);
			ctx.restore();
		};

		EqualizerBar.prototype.drawBack = function(ctx, x, y, i)
		{
			var height = ctx.canvas.height;
			var w = this.owner.barsWidth * this.owner.backScale / 5;

			var prescale = i > 0 ? this.owner.bars[i - 1].scale : 0;
			var postscale = i < (this.owner.barsCount - 1) ? this.owner.bars[i + 1].scale : 0;

			var offset = -5;
			var k = 1.0;
			var a = 0.5;

			var s1 = ((prescale * 2 + this.scale * 3) / 5 * k + a) * calcV(i - 0.4, this.owner.barsCount, offset) * 0.8;
			var s2 = ((prescale + this.scale * 4) / 5 * k + a) * calcV(i - 0.2, this.owner.barsCount, offset) * 0.8;
			var s3 = (this.scale * k + a) * calcV(i, this.owner.barsCount, offset) * 0.8;
			var s4 = ((postscale + this.scale * 4) / 5 * k + a) * calcV(i + 0.2, this.owner.barsCount, offset) * 0.8;
			var s5 = ((postscale * 2 + this.scale * 3) / 5 * k + a) * calcV(i + 0.4, this.owner.barsCount, offset) * 0.8;

			ctx.save();
			ctx.fillStyle = hsv({h: 0.09 + s1 * 0.01/*Math.max((i - 0.4) / (this.owner.barsCount - 1), 0)*/, 	s: 1, v: s1});
			ctx.fillRect(x - w * 2, y - height, w + 1, height);
			ctx.fillStyle = hsv({h: 0.09 + s2 * 0.01/*Math.max((i - 0.2) / (this.owner.barsCount - 1), 0)*/, 	s: 1, v: s2});
			ctx.fillRect(x - w, 	y - height, w + 1, height);
			ctx.fillStyle = hsv({h: 0.09 + s3 * 0.01/*i / (this.owner.barsCount - 1)*/, 							s: 1, v: s3});
			ctx.fillRect(x, 		y - height, w + 1, height);
			ctx.fillStyle = hsv({h: 0.09 + s4 * 0.01/*Math.min((i + 0.2) / (this.owner.barsCount - 1), 1)*/, 	s: 1, v: s4});
			ctx.fillRect(x + w, 	y - height, w + 1, height);
			ctx.fillStyle = hsv({h: 0.09 + s5 * 0.01/*Math.min((i + 0.4) / (this.owner.barsCount - 1), 1)*/, 	s: 1, v: s5});
			ctx.fillRect(x + w * 2, y - height, w + 1, height);
			ctx.restore();
		};
//	}

//	class Equalizer : Visualizer
//	{
		function Equalizer(player)
		{
			Visualizer.apply(this, arguments);

			this.barsCount = 56;
			this.barsWidth = EQ_BARS_WIDTH;
			this.backScale = EQ_BACK_SCALE;
			this.dataSize = 128;
			this.ownDataSize = 100;

			for(var i = 0; i < this.barsCount; ++i)
				this.bars.push(new EqualizerBar(this, i));
		};

		Equalizer.prototype = Object.create(Visualizer.prototype);
		Equalizer.prototype.constructor = Equalizer;

		Equalizer.prototype.draw = function()
		{
			var
				x = (this.canvas.width - (this.barsCount * this.barsWidth + (this.barsCount - 1) * 3)) / 2,
				y = this.canvas.height * 0.95;

			for(var i = 0; i < this.barsCount; ++i)
			{
				this.bars[i].draw(this.ctx, x, y, i);
				x += this.barsWidth + 3;
			}
		};

		Equalizer.prototype.drawBack = function()
		{
			var
				x = (this.canvas.width - (this.barsCount * this.barsWidth * this.backScale)) / 2,
				y = this.canvas.height;

			for(var i = 0; i < this.barsCount; ++i)
			{
				this.bars[i].drawBack(this.ctx, x, y, i);
				x += this.barsWidth * this.backScale;
			}
		};

		Equalizer.prototype.animate = function()
		{
			Visualizer.prototype.animate.apply(this);

			this.drawBack();
			this.draw();
		};
//	}

function volumeFadeOn()
{
	volumeFade += volumeFadeSpeed;

	if(volumeFade >= 1.0)
	{
		volumeFade = 1.0;
		volumeFadeState = 0;
		return;
	}

	player.setVolume(player.volume);
	setTimeout("volumeFadeOn()", volumeFadePeriod);
}

function play()
{
	if(player.audio.error && player.audio.error.code > 0)
		console.error(player.audio.error);

	player.audio.play();
	volumeFadeOn();
}

function pause()
{
	volumeFade = 0.0;
	player.audio.pause();
}

function setPausedState()
{
	jQuery(player.container).fadeTo(1000, 0.0);
	player.enabled = false;
	player.setImage(player.imgPlay);
	player.btn.setAttribute("title", "Воспроизведение");
}

function setPlayingState()
{
	jQuery(player.container).show();
	jQuery(player.container).fadeTo(1000, 1.0);
	player.setImage(player.imgPause);
	player.btn.setAttribute("title", "Пауза");
}

function setConnectingState()
{
	player.setImage(player.imgConnecting);
	player.btn.style.cursor = "default";
	player.btn.setAttribute("title", "Соединение...");
}

function setState(state)
{
	var s = parseInt(state);

	switch(s)
	{
	case 0:
		break;
	case 1:
		break;
	default:
		jQuery(player.container).fadeTo(1000, 0.0);
		player.enabled = false;
		player.setImage(player.imgError);
		player.btn.setAttribute("title", "Ошибка сервера");
		pause();

		console.error("MTTT Radio: Ошибка сервера! Данные - " + s);
	}

	player.isConnecting = false;
	player.btn.style.cursor = "pointer";
}

function connectionFailed()
{
	player.enabled = false;
	player.setImage(player.imgNoConnection);
	player.btn.setAttribute("title", "Не удалось связаться с сервером. Нажмите, чтобы повторить попытку");
	pause();

	player.isConnecting = false;
	player.btn.style.cursor = "pointer";
}

function findSource(sources, station)
{
	if(sources instanceof Array)
	{
		for(var i = 0; i < sources.length; ++i)
			if(sources[i].server_name == station.server_name)
				return sources[i];

		return null;
	}

	return sources;
}

function getInfo()
{
	jQuery.post(player.infoGetter, {address: encodeURIComponent(player.root.indexOf("kamchatkalive") >= 0 ? streamInfo : localStreamInfo)},
		function(data)
		{
			if(data.error)
			{
				console.warn("Не удалось получить информацию о потоке");
				player.text.innerHTML = "";
				player.text.title = "";
			}
			else
			{
				var
					source = findSource(data.icestats.source, player.station),
					title = source ? (source.title ? source.title : "Неизвестно") : "Неизвестно",
					listeners = source ? (typeof(source.listeners) !== "undefined" ? (enable_pseudo ? (player.station.a * source.listeners + player.station.b) : source.listeners) : "?") : "?";

				var s = title;

				if (s.length > MAX_STRING_WIDTH)
					s = s.substring(0, MAX_STRING_WIDTH) + "...";

				var
					fontsize = 16,
					hoffset = 0;

				if(s.length > BIG_STRING_WIDTH)
				{
					fontsize = 12;
					hoffset = 12;
				}

				player.text.innerHTML = '<span style="font-size: ' + fontsize + 'px; line-height: ' + fontsize + 'px;">' + streamInfoText + s + '<p style="margin: 0">' + streamListenText + listeners + '</p></span>';
				player.text.title = title;
			}
		},
	'json').fail(
		function()
		{
			console.warn("Не удалось получить информацию о потоке");
			player.text.innerHTML = "";
			player.text.title = "";
		}
	);
}

function getInfoLoop()
{
	getInfo();
	setTimeout("getInfoLoop()", 15000);
}

function togglePlaying()
{
	if(player.isConnecting)
		return;

	if(!player.audio.paused)
	{
		pause();
		player.autoplay = 0;
		player.audio.setAttribute("src", "");
		setPausedState();
        jQuery.post(player.stateSaver, {autoplay: 0}, setState, 'text').fail(connectionFailed);
	}
	else
	{
		player.autoplay = 1;
		player.audio.setAttribute("src", player.station.address);
		player.isConnecting = true;
		player.enabled = true;
		setConnectingState();
		play();
	}
};

function getPreviousStation()
{
	return stations[(player.station.index == 0 ? stations.length : player.station.index) - 1];
}

function getNextStation()
{
	return stations[(player.station.index + 1) % stations.length];
}

function changeStation()
{
	player.text.innerHTML = "";
	player.text.title = "";

	pause();

	if(player.autoplay == 1)
	{
		player.audio.setAttribute("src", player.station.address);
		player.isConnecting = true;
		player.enabled = true;
		setConnectingState();
		play();
	}

	jQuery.post(player.stateSaver, {station_id: player.station.key}, function() {}, 'text');

	player.station_name.innerHTML = player.station.name;
	getInfo();
	player.prev.title = "Предыдущая станция: " + getPreviousStation().name;
	player.next.title = "Следующая станция: " + getNextStation().name;
};

function previousStation()
{
	player.station = getPreviousStation();
	changeStation();
}

function nextStation()
{
	player.station = getNextStation();
	changeStation();
}

function drawPlayer()
{
	while(true)
	{
		if(!player.analyser)
		{
			if(player.audio.paused)
			{
				for(var i = 0; i < player.visualizer.barsCount; ++i)
					player.visualizer.bars[i].scale = 0.0;

				break;
			}

			var volume = Math.sqrt(Math.max(0.0, player.audio.volume));
			var speed = 0.3;

			for(var i = 0; i < player.visualizer.barsCount; ++i)
			{
				var q = 1.0 - 0.25 * (1.0 - (player.visualizer.barsCount - i) / player.visualizer.barsCount);

				player.visualizer.bars[i].h = Math.max(Math.min(player.visualizer.bars[i].h + (speed * (Math.random() - 0.5)), 1.0), q * 0.5);
				player.visualizer.bars[i].scale = Math.min(player.visualizer.bars[i].h * (q * q + 0.3), 1.0) * 0.8 * volume;
			}

			break;
		}

		player.analyser.getByteFrequencyData(player.bands);

		for(var i = 0; i < player.visualizer.barsCount; ++i)
			player.visualizer.bars[i].scale = player.bands[Math.floor(i * player.visualizer.ownDataSize / player.visualizer.barsCount)] / 256 * 0.8;

		break;
	}

	player.visualizer.animate();
	player.animate();
}

function createImage(src)
{
	return 'url("' + src + '")';
}

function trim(str)
{
	var charlist = ' \s\xA0';
	var re = new RegExp('^[' + charlist + ']+|[' + charlist + ']+$', 'g');

	return str.replace(re, '');
}

function initializeStations()
{
	for(var i = 0; i < stations.length; ++i)
	{
		var station = stations[i];
		station.index = i;

		if(player.provider)
			station.address = player.provider.address + ((player.quality == "bad") ? station.slow : station.normal);
	}
}

function addOptions(container, options, current)
{
	for(var i = 0; i < options.length; ++i)
	{
		var option = options[i];
		var jq = jQuery('<div class="option">' + option.caption + '</div>')

		if (option.key == current)
			jq.addClass("current");

		container.append(jq);
	}
}

//	class Player
//	{
		function Player()
		{
			"use strict";
			this.config =
			{
				interval: 10,
				type: "canvas"
			};

			player = this;
			this.root = document.getElementById('root').value;
			this.isSupported = true;

			this.stateSaver  = this.root + "modules/mod_radio_mttt/ajax/state.php";
			this.infoGetter  = this.root + "modules/mod_radio_mttt/ajax/info.php";
			this.optionSaver = this.root + "modules/mod_radio_mttt/ajax/options.php";

		    this.imgPlay 			= createImage(this.root + 'modules/mod_radio_mttt/img/play.png');
		    this.imgPause 			= createImage(this.root + 'modules/mod_radio_mttt/img/pause.png');
		    this.imgError 			= createImage(this.root + 'modules/mod_radio_mttt/img/error.png');
		    this.imgConnecting 		= createImage(this.root + 'modules/mod_radio_mttt/img/synchronize.png');
		    this.imgNoConnection 	= createImage(this.root + 'modules/mod_radio_mttt/img/no_connection.png');

			this.station_id = d.getElementById('station_id').value;
			this.provider_id = d.getElementById('provider_id').value;
			this.quality = d.getElementById('quality').value;
			this.temp_provider_id = this.provider_id;
			this.temp_quality = this.quality;

			this.container = d.getElementById('radio_visualizer');
			this.canvas = d.getElementById("radio_canvas");

			if(this.canvas)
				this.canvasContext = this.canvas.getContext('2d');

			this.text = d.getElementById('player_text');

			getInfoLoop();

			this.prev = d.getElementById('prev_station');
			this.btn  = d.getElementById('play_pause');
			this.next = d.getElementById('next_station');
			this.menu = d.getElementById('menu');

			this.station_name = d.getElementById('station_name');

			this.setImage(this.imgPlay);

			this.enabled = false;
			this.visualizer = null;
			this.analyser = null;

	        try
	        {
	            this.visualizer = new Equalizer(this);

				this.isConnecting = false;
                this.createAudio();

    			this.prev.addEventListener('click', previousStation);
    			this.btn.addEventListener('click', togglePlaying);
    			this.next.addEventListener('click', nextStation);
				this.menu.addEventListener('click', function()
				{
					darkness.style.display = "block";
					return true;
				});

				this.save = jQuery('#o_save');
				this.cancel = jQuery('#o_cancel');

				var prov_options = jQuery(".provider");
				var qual_options = jQuery(".quality");

				addOptions(prov_options, providers, this.provider_id);

				if(browser.name == 'Chrome' || (browser.name == 'Opera' && browser.version >= 26))
				{
					addOptions(qual_options, qualities, this.quality);
				}
				else
				{
					this.quality = "good";
					qual_options.hide();
				}

				prov_options.on("click", ".option", function()
				{
					var option = jQuery(this);

					if(!option.hasClass("current"))
						player.selectOption(option);

					player.save.show();
				});

				qual_options.on("click", ".option", function()
				{
					var option = jQuery(this);

					if(!option.hasClass("current"))
						player.selectOption(option);
				});

				this.save.on("click", function()
				{
					player.saveOptions();
					darkness.style.display = "none";
					return true;
				});

				this.setProvider();

				if(this.provider === null)
				{
					this.save.hide();
					this.cancel.hide();
				}

				this.cancel.on("click", function()
				{
					darkness.style.display = "none";
					return true;
				});

                this.autoplay = document.getElementById('autoplay').value;

				this.station = findStation(this.station_id);

				if(this.station === null)
					this.station = findStation("dance");

				this.station_name.innerHTML = this.station.name;

				this.prev.title = "Предыдущая станция: " + getPreviousStation().name;
				this.next.title = "Следующая станция: " + getNextStation().name;

				if(this.canvas)
					this.animate();
	        }
	        catch (e)
	        {
				this.isSupported = false;
	        	this.text.innerHTML = "Произошла ошибка при загрузке проигрывателя!";
				console.error(e.stack);
	        }
	    };

		Player.prototype.setProvider = function()
		{
			this.provider = findProvider(this.provider_id);

			if(this.provider === null)
				darkness.style.display = "block";

			initializeStations();

			if(this.provider)
			{
				this.cancel.show();

				if(this.provider.address) try
				{
					var addr = this.provider.address.replace("http://", "").replace("https://", "");
					var root = this.root.replace("http://", "").replace("https://", "");

					if(!AudioCtx)
        			{
						AudioCtx = AudioContext || w.AudioContext || w.webkitAudioContext;
						this.analyser = null;
					}

	    	        if(!mobile && (browser.name == 'Chrome' || (browser.name == 'Opera' && browser.version >= 26)) && addr.indexOf(":") < 0 && addr.split('/')[0] == root.split('/')[0])
	    	        {
						if(this.analyser == null)
						{
			                this.audioContext = new AudioCtx();

			                this.gainNode = this.audioContext.createGain();
			                this.gainNode.gain.value = 0.4;

			                this.analyser = this.audioContext.createAnalyser();
			                this.analyser.smoothingTimeConstant = SMOOTHING;
			                this.analyser.fftSize = this.visualizer.dataSize * 2;

							this.bands = new Uint8Array(this.visualizer.dataSize);

			                this.audioSource = this.audioContext.createMediaElementSource(this.audio);

			                this.audioSource.connect(this.analyser);
			                this.analyser.connect(this.gainNode);
			                this.gainNode.connect(this.audioContext.destination);
						}
	    	        }
					else
					{
						if(this.analyser)
						{
							this.audioSource.mediaElement = null;
							this.audioSource.disconnect();
		                	this.analyser.disconnect();
							this.gainNode.disconnect();
							this.audioContext.destination.disconnect();

							this.analyser = null;
							this.gainNode = null;
							this.audioSource = null;
							this.audioContext.destination = null;
							this.audioContext.close();
							this.audioContext = null;

							this.createAudio();
						}
					}
				}
				catch(e)
				{
					console.error(e);
				}
			}
		}

		Player.prototype.createAudio = function()
		{
			if(mobile)
			{
				this.audioParent = jQuery("#audio").parent();
				this.audioParent.remove("#audio");
				this.audio = jQuery('<video id="audio"></video>');
				this.audio.appendTo(this.audioParent);
				this.audio = this.audio[0];
			}
			else
				this.audio = new Audio();

            this.audio.src = "";

            this.audio.onerror = function()
            {
            	if(player.audio.src == player.station.address)
            		connectionFailed();
            };

			this.audio.onloadeddata = function()
			{
				setPlayingState();
    			jQuery.post(player.stateSaver, {autoplay: 1}, setState, 'text').fail(connectionFailed);
			};
		}

		Player.prototype.saveOptions = function()
		{
			this.provider_id = this.temp_provider_id;
			this.quality = this.temp_quality;

			pause()

			this.setProvider();

			if(this.station != null)
				changeStation();

			if(player.autoplay == 1)
				play();

			jQuery.post(this.optionSaver, {provider_id: this.provider_id, quality: this.quality}, function() {}, 'text')
				.fail(function(response)
				{
					console.warn(response);
				});
		}

		Player.prototype.selectOption = function(option)
		{
			var list = option.parent();
			var index = list.children().index(option) - 1;

			list.children(".current").removeClass("current");
			option.addClass("current");

			if(list.hasClass("provider"))
				this.temp_provider_id = providers[index].key;

			if(list.hasClass("quality"))
				this.temp_quality = qualities[index].key;
		}

		Player.prototype.animate = function()
		{
			requestAnimationFrame(drawPlayer);
		};

		Player.prototype.setImage = function(image)
		{
			this.btn.style.backgroundImage = image;
		};

		Player.prototype.setVolume = function(value)
		{
			this.volume = value;
			this.audio.volume = this.volume * volumeFade;
        	jQuery.post(player.stateSaver, {volume: this.volume}, function(){}, 'text');
		}
//	}

	function getZoomFactor()
	{
		if(!document.body.getBoundingClientRect)
			return 1;

		var rect = document.body.getBoundingClientRect();
		var physicalW = rect.right - rect.left;
		var logicalW = document.body.offsetWidth;

		return Math.round ((physicalW / logicalW) * 100) / 100;
	}

	function Box(left, top, width, height)
	{
		this.left = left;
		this.top = top;
		this.width = width;
		this.height = height;
		this.right = this.left + this.width;
		this.bottom = this.top + this.height;
	}

	function getBox(element)
	{
		if(element.getBoundingClientRect)
		{
			var rect = element.getBoundingClientRect();
			x1 = rect.left;
			y1 = rect.top;
			w = rect.right - rect.left;
			h = rect.bottom - rect.top;

			if(browser.name == "IE")
			{
				x1 -= document.documentElement.clientLeft;
				y1 -= document.documentElement.clientTop;

				var zoomFactor = getZoomFactor();

				if(zoomFactor != 1)
				{
					x1 = Math.round(x1 / zoomFactor);
					y1 = Math.round(y1 / zoomFactor);
					w = Math.round(w / zoomFactor);
					h = Math.round(h / zoomFactor);
				}
			}

			return new Box(x1, y1, w, h);
		}

		return undefined;
	}

//	class Slider
////	{
		function Slider()
		{
			slider = this;

			this.surface = d.getElementById("slider");

			if(this.surface)
			{
				var box = this.getContainer();

				this.volume = Math.round(d.getElementById("volume").value * 100) / 100;
				player.setVolume(this.volume);
				this.calculatePos(box);
				this.moveHandle();

				this.isDragging = false;
				this.isHovering = false;

				this.surface.addEventListener('mousedown', function(e)
				{
					e = e || window.event;

					if(e.button !== 0)
						return;

					slider.isDragging = true;
					slider.setState(2);
					slider.updatePos(e.clientX, e.clientY);
				});

				this.surface.addEventListener('mouseenter', function(e)
				{
					slider.isHovering = true;

					if(!slider.isDragging)
						slider.setState(1);
				});

				this.surface.addEventListener('mouseleave', function(e)
				{
					slider.isHovering = false;

					if(!slider.isDragging)
						slider.setState(0);
				});

				window.addEventListener('mousewheel', function(e)
				{
					e = e || window.event;

					if(slider.isHovering)
					{
						slider.setVolume(slider.volume + (e.wheelDelta ? (e.wheelDelta / 120) : -(e.detail / 3)) * 0.05);
						e.preventDefault();
						e.returnValue = false;
					}
				});

				window.addEventListener("DOMMouseScroll", function(e)
				{
					e = e || window.event;

					if(slider.isHovering)
					{
						slider.setVolume(slider.volume + (e.wheelDelta ? (e.wheelDelta / 120) : (e.detail / -3)) * 0.05);
						e.preventDefault();
						e.returnValue = false;
					}
				}, false);

				document.addEventListener("scrollstart", function(e)
				{
					e = e || window.event;

					if(slider.isHovering)
					{
						e.preventDefault();
						e.returnValue = false;
					}
				}, false);

				document.addEventListener("scroll", function(e)
				{
					e = e || window.event;

					if(slider.isHovering)
					{
						e.preventDefault();
						e.returnValue = false;
					}
				}, false);

				document.onselectstart = function()
				{
					return !slider.isDragging;
				};

				document.addEventListener('mouseup', function(e)
				{
					e = e || window.event;

					if(e.button !== 0)
						return;

					if(slider.isDragging)
						slider.setState(slider.isHovering ? 1 : 0);

					slider.isDragging = false;
				});

				document.addEventListener('mousemove', function(e)
				{
					e = e || window.event;

					if(slider.isDragging)
						slider.updatePos(e.clientX, e.clientY);
				});

				this.surface.addEventListener('touchstart', function(e)
				{
					slider.isDragging = true;
					slider.isHovering = true;
				});

				this.surface.addEventListener('touchend', function(e)
				{
					slider.isDragging = false;
					slider.isHovering = false;
				});

				this.surface.addEventListener('touchcancel', function(e)
				{
					slider.isDragging = false;
					slider.isHovering = false;
				});

				this.surface.addEventListener('touchmove', function(e)
				{
					e = e || window.event;
					var touches = e.changedTouches;

					slider.updatePos(touches[0].clientX, touches[0].clientY);
					e.preventDefault();
					e.returnValue = false;
				});
			}
		}

		Slider.prototype.setVolume = function(volume)
		{
			player.setVolume(this.volume = Math.max(0, Math.min(1, volume)));
			this.calculatePos(this.getContainer());
		};
//	}

//	class HorizontalSlider
//	{
		function HorizontalSlider()
		{
			Slider.apply(this, arguments);
			this.handle = d.getElementById("slider_handle");
		}

		HorizontalSlider.prototype = Object.create(Slider.prototype);
		HorizontalSlider.prototype.constructor = HorizontalSlider;

		HorizontalSlider.prototype.getContainer = function()
		{
			return getBox(this.surface);
		}

		HorizontalSlider.prototype.updatePos = function(clientX, clientY)
		{
			var
				box = this.getContainer(),
				x = clientX - box.left;

			this.pos = Math.max(0, Math.min(box.width, x));
			this.calculateVolume(box);
		};

		HorizontalSlider.prototype.calculateVolume = function(box)
		{
			this.setVolume(box.width > 0 ? this.pos / box.width : 0.0);
		};

		HorizontalSlider.prototype.calculatePos = function(box)
		{
			this.pos = box.width * this.volume;
			this.moveHandle();
		};

		HorizontalSlider.prototype.moveHandle = function()
		{
			var handlebox = getBox(this.handle);
			this.handle.style.marginLeft = (this.pos - handlebox.width / 2 + 1) + "px";
		};

		HorizontalSlider.prototype.setState = function(state)
		{
			switch(state)
			{
				case 0:
					this.handle.style.backgroundColor = "#888";
					break;
				case 1:
					this.handle.style.backgroundColor = "#fff";
					break;
				case 2:
					this.handle.style.backgroundColor = "#bbb";
					break;
			}
		};
//	}

//	class VerticalSlider
//	{
		function VerticalSlider()
		{
			Slider.apply(this, arguments);
			this.handle = d.getElementById("slider_handle");
		}

		VerticalSlider.prototype = Object.create(Slider.prototype);
		VerticalSlider.prototype.constructor = VerticalSlider;

		VerticalSlider.prototype.getContainer = function()
		{
			var
				box = getBox(this.surface),
				handlebox = getBox(this.handle);

			box.height -= (handlebox.height + 2);
			box.bottom -= (handlebox.height + 2);

			return box;
		}

		VerticalSlider.prototype.updatePos = function(clientX, clientY)
		{
			var
				box = this.getContainer(),
				handlebox = getBox(this.handle),
				y = box.bottom - clientY + handlebox.height / 2 + 1;

			this.pos = Math.max(0, Math.min(box.height, y));
			this.calculateVolume(box);
		};

		VerticalSlider.prototype.calculateVolume = function(box)
		{
			this.setVolume(box.height > 0 ? this.pos / box.height : 0.0);
		};

		VerticalSlider.prototype.calculatePos = function(box)
		{
			this.pos = box.height * this.volume;
			this.moveHandle();
		};

		VerticalSlider.prototype.moveHandle = function()
		{
			var box = this.getContainer();
			this.handle.style.marginTop = (box.height - this.pos) + "px";
		};

		VerticalSlider.prototype.setState = function(state)
		{
			switch(state)
			{
				case 0:
					this.handle.style.backgroundColor = "#888";
					break;
				case 1:
					this.handle.style.backgroundColor = "#fff";
					break;
				case 2:
					this.handle.style.backgroundColor = "#bbb";
					break;
			}
		};
//	}

//	class VerticalScale
//	{
		function VerticalScale()
		{
			this.canvas = d.getElementById("slider-canvas");

			if(this.canvas)
				this.ctx = this.canvas.getContext('2d');

			this.divisions = 6;
			this.colors = ["#333", "#6d0"];
			Slider.apply(this, arguments);
		}

		VerticalScale.prototype = Object.create(Slider.prototype);
		VerticalScale.prototype.constructor = VerticalScale;

		VerticalScale.prototype.getContainer = function()
		{
			return getBox(this.surface);
		}

		VerticalScale.prototype.updatePos = function(clientX, clientY)
		{
			var
				box = this.getContainer(),
				y = box.bottom - clientY;

			this.pos = Math.max(0, Math.min(box.height, y));
			this.calculateVolume(box);
		};

		VerticalScale.prototype.calculateVolume = function(box)
		{
			this.setVolume(box.height > 0 ? this.pos / box.height : 0.0);
		};

		VerticalScale.prototype.calculatePos = function(box)
		{
			this.pos = box.height * this.volume;
			this.moveHandle();
		};

		VerticalScale.prototype.moveHandle = function()
		{
			var box = this.getContainer();
			this.redraw();

			this.surface.title = "Громкость: " + Math.round(this.volume * 100) + "%";
		};

		VerticalScale.prototype.redraw = function()
		{
			if (!this.ctx)
				return;

			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

			var
				y = 2,
				flag = true;

			for(var i = 0; i < this.divisions; ++i)
			{
				this.ctx.fillStyle = hsv({h: 0.33 * (1 - i / (this.divisions - 1)), s: 1, v: y > this.pos ? 0.2 : 0.9})
				this.ctx.fillRoundRect(2, this.canvas.height - y - 4, this.canvas.width - 4, 4, 1);
				y += 6;
			}
		};

		VerticalScale.prototype.setState = function(state) {};
//	}

w.onload = function()
{
	darkness = document.getElementById('darkness');

	var
		cmenu = document.getElementById('centered_menu'),
		pmenu = document.getElementById('radio_menu');

	cmenu.innerHTML = pmenu.parentNode.innerHTML;
	pmenu.parentNode.innerHTML = "";

	new Player();

	if(player.isSupported)
	{
		new VerticalScale();

    	if(!mobile && player.autoplay == 1)
    		togglePlaying();
	}

	var chatOutput = jQuery("#KIDE_output");
	var chatText = jQuery("#KIDE_txt");
	var mensaje = jQuery("#KIDE_mensaje");
	var closer = mensaje.children(".KIDE_cerrar_x");

	mensaje.css({"display": "none !important"});

	chatOutput.on('click', ".KIDE_registered, .KIDE_guest, .KIDE_admin", function(e)
	{
		var that = jQuery(this);
        chatText.val(chatText.val() + that.html() + ": ");
		chatText.focus();
		mensaje.hide();
	});

	chatOutput.on('dblclick', ".KIDE_registered, .KIDE_guest, .KIDE_admin", function(e)
	{
		e.stopPropagation();
	});

	chatOutput.on('dblclick', ".KIDE_msg_top", function(e)
	{
		var these = jQuery(this).children(".KIDE_registered, .KIDE_guest, .KIDE_admin");
		mensaje.css({"display": "none"});
		these[0].onclick();
	});

	closer.on('click', function(e)
	{
		mensaje.css({"display": "none !important"});
	});
};