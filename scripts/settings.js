$(document).ready(function() {
    $('#settings-text').click(function() {
        var blocker = $('<div id="blocker"></div>').mousedown(function(event) {
            $('#blocker').remove();
            $('#settings-popup').hide();
            event.stopPropagation();
        });
        blocker.appendTo('body');
        $('#settings-popup').show();
    });
	
	var settings = new Settings();
    $('#qualityLowRadio')
		.attr('checked', (settings.quality === 'small'))
		.change(function() { 
			var settings = new Settings();
			settings.quality = 'small'; 
			settings.save(); 
		});
	$('#qualityHighRadio')
		.attr('checked', (settings.quality === 'hd720'))
		.change(function() { 
			var settings = new Settings();
			settings.quality = 'hd720'; 
			settings.save(); 
		});
		
	if (!window.webkitNotifications)
		$('#settings .notifications').hide();
	$('#notificationRange').change(function() {
		$('#notificationRangeText').text(this.value);
		var settings = new Settings();
		settings.announceTimeout = parseInt(this.value) * 1000; 
		settings.save(); 
	});
});

function autoDetectLanguage() {
    var supportedLangs = {
        'en-US': 'en_US',
        'sv': 'sv_SE'
    };

    try {
        var lang = accept_language_header.substring(0, 2);
        if (lang in supportedLangs) {
            return supportedLangs[lang];
        } 
    } catch (e) {
    }

    return 'en_US';
}

function Settings() {
    var settings;
    if (logged_in) {
        settings = JSON.parse(localStorage['loggedInSettings'] || '{}');
    } else {
        settings = JSON.parse(localStorage['loggedOutSettings'] || '{}');
    }

    this.language = settings.language || autoDetectLanguage();
    this.translatorMode = settings.translatorMode || false;
    this.theme = settings.theme || 'default';
	this.quality = settings.quality || 'hd720';
	this.announceTimeout = settings.announceTimeout || 3000;

    this.save = function() {
        var key = logged_in ? 'loggedInSettings' : 'loggedOutSettings';
        localStorage[key] = JSON.stringify({
            'language': this.language,
            'translatorMode': this.translatorMode,
            'theme': this.theme,
			'quality': this.quality,
			'announceTimeout': this.announceTimeout
        });
    }
}
