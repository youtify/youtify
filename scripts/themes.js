
$(document).ready(function() {
	
	$('#themes-default').hover(function() {
		$('#settings .themes span').text('Greytify');
	}).click(function(event) {
		changeTheme('default');
		event.stopPropagation();
	});
	$('#themes-black').hover(function() {
		$('#settings .themes span').text('Black');
	}).click(function(event) {
		changeTheme('black');
		event.stopPropagation();
	});
	$('#themes-pink').hover(function() {
		$('#settings .themes span').text('Hello Pink');
	}).click(function(event) {
		changeTheme('pink');
		event.stopPropagation();
	});
	$('#themes-red').hover(function() {
		$('#settings .themes span').text('Red');
	}).click(function(event) {
		changeTheme('red');
		event.stopPropagation();
	});
	$('#themes-itheme').hover(function() {
		$('#settings .themes span').text('iTheme');
	}).click(function(event) {
		changeTheme('itheme');
		event.stopPropagation();
	});
	$('#themes-wamp').hover(function() {
		$('#settings .themes span').text('Wamp');
	}).click(function(event) {
		changeTheme('wamp');
		event.stopPropagation();
	});
	$('#themes-wlive').hover(function() {
		$('#settings .themes span').text('Wlive');
	}).click(function(event) {
		changeTheme('wlive');
		event.stopPropagation();
	});
	$('#themes-cloud').hover(function() {
		$('#settings .themes span').text('Cloud - experimental!');
	}).click(function(event) {
		changeTheme('cloud');
		event.stopPropagation();
		if (confirm('WARNING! This theme is experimental and your browser may crash! Save all your work and continue on your own risk!'))
			createClouds();
	});
});

function changeTheme(themeName) {
    /*if ($('#less').length === 0) {
        $('<link id="less" rel="stylesheet/less" />').appendTo('head');
    }*/
    var settings = new Settings();
    settings.theme = themeName;
    settings.save();

	$('#loading span').text('Loading...');
    $('#loading').show();
	
    $('#less\\:styles-' + themeName).remove();
    $('#less').attr('href', '/styles/' + themeName + '.less');
    less.refresh(false);

	if (themeName === 'cloud') {
		cloudsEnabled = true;
		$(window).resize(function(){createClouds();});
	} else {
		cloudsEnabled = false;
		$('#canvas').hide();
		//if (cloudTravelInterval != null)
		//	clearInterval(cloudTravelInterval);
	}
	
    $(window).resize();

	$('#loading').fadeOut();
}

var clouds = [];
var canvasClouds = [];
var cloudTravelInterval = null;
var cloudsEnabled = false;
function loadClouds() {
	var img = new Image();
	img.onload = function() { 
		clouds.push(this); 
		if (clouds.length < 5) {
			loadClouds(); 
		} else {
			createClouds();
		}
	};
	img.src = '/images/clouds/'+(clouds.length+1)+'.png';
}

function createClouds() {
	if (!cloudsEnabled)
		return;
	if (clouds.length === 0) {
		loadClouds();
		return;
	}
	
	var windowHeight = $(window).height();
	var windowWidth = $(window).width();
	var canvas = $('#canvas')[0];
	canvas.width = windowWidth;
	canvas.height = windowHeight;
	var ctx = canvas.getContext("2d");
	//var backdrop = ctx.createLinearGradient(0, 0, 0, windowHeight)
	canvasClouds = [];
	for(var i = 0; i < 100; i++) {
		var rnd = Math.random()*3;
		var index = parseInt(Math.random()*(clouds.length));
		var img = clouds[index];
		var width = parseInt(rnd*$(img).width()) || rnd*300;
		var height = parseInt(rnd*$(img).height()) || rnd*200;
		var x = parseInt((Math.random()*windowWidth) - (width/2));
		var y = parseInt((windowHeight/2) + (rnd*height -height));
		ctx.drawImage(
			img, 
			x,
			y, 
			width,
			height);
		canvasClouds.push({'img': img, 'x': x, 'y': y, 'width': width, 'height': height, 'speed': rnd});
	}
	$(canvas).show();
	console.log("created clouds");
	//cloudTravelInterval = setInterval(function() { cloudTravel(); }, 30);
}

function cloudTravel() {
	var windowHeight = $(window).height();
	var windowWidth = $(window).width();
	var canvas = $('#canvas')[0];
	canvas.width = windowWidth;
	canvas.height = windowHeight;
	var ctx = canvas.getContext("2d");
	
	for(var i = 0; i < canvasClouds.length; i++) {
		var rnd = Math.random()*3;
		var index = parseInt(Math.random()*(clouds.length));
		var img = clouds[index];
		var width = parseInt(rnd*$(img).width()) || rnd*300;
		var height = parseInt(rnd*$(img).height()) || rnd*200;
		var x = parseInt((Math.random()*windowWidth) - (width/2));
		var y = parseInt((windowHeight/2) + (rnd*height -height));
		canvasClouds[i]['x'] += canvasClouds[i]['speed']
		if (canvasClouds[i]['x'] > windowWidth)
			canvasClouds[i]['x'] = -(canvasClouds[i]['width'] + 10);
		ctx.drawImage(
			canvasClouds[i]['img'], 
			canvasClouds[i]['x'],
			canvasClouds[i]['y'],
			canvasClouds[i]['width'],
			canvasClouds[i]['height']
		);
	}
}
