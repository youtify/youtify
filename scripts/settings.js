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
    var settings = JSON.parse(localStorage['settings'] || '{}');

    this.language = settings.language || autoDetectLanguage();
    this.translatorMode = settings.translatorMode || false;
    this.theme = settings.theme || 'default';
	this.quality = settings.quality || 'hd720';

    this.save = function() {
        localStorage['settings'] = JSON.stringify({
            'language': this.language,
            'translatorMode': this.translatorMode,
            'theme': this.theme,
			'quality': this.quality
        });
    }
}
