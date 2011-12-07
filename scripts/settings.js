function settings_Init() {
    $('#top .settings').click(function() {
        $(this).arrowPopup('#settings');
    });
	
	var settings = new Settings();

    // FLATTR

    if (has_flattr_access_token) {
        $('<span>Connected as </span>').appendTo('#settings > .flattr');
        $('<a class="username" target="_blank"></a>').attr('href', 'https://flattr.com/profile/' + flattr_user_name).text(flattr_user_name).appendTo('#settings > .flattr');
        $('<a class="disconnect" href="/flattrdisconnect">Disconnect</a>').appendTo('#settings > .flattr');
    } else {
        $('<a href="/flattrconnect">Connect to Flattr</a>').appendTo('#settings > .flattr');
    }

    // QUALITY

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
		
    // NOTIFICATIONS

	if (!window.webkitNotifications) {
		$('#settings .notifications').hide();
    }
	$('#notificationRange').change(function() {
		$('#notificationRangeText').text(this.value);
		var settings = new Settings();
		settings.announceTimeout = parseInt(this.value, 10) * 1000;
		settings.save(); 
	});

    // LANGUAGE

    $('#settings .language select').change(function() {
        var code = $(this).val();
        var settings = new Settings();
        settings.language = code;
        settings.save();
        changeLanguage(code);
    });

    // TRANSLATION TOOL

    $('#settings input[name=enableTranslationTool]').click(function() {
        if (this.checked) {
            $("#translations").show();
            settings.enableTranslationTool = true;
        } else {
            $("#translations").hide();
            settings.enableTranslationTool = false;
        }
        settings.save();
    });

    if (settings.enableTranslationTool) {
        $("#translations").show();
        $('#settings input[name=enableTranslationTool]').attr('checked', 'checked');
    }
}

function Settings() {
    var settings = JSON.parse(localStorage.settings || '{}');

    this.language = settings.language || autoDetectedLanguageByServer;
	this.enableTranslationTool = settings.enableTranslationTool || false;
	this.quality = settings.quality || 'hd720';
	this.announceTimeout = settings.announceTimeout || 3000;

    this.save = function() {
        localStorage.settings = JSON.stringify({
            'language': this.language,
            'enableTranslationTool': this.enableTranslationTool,
			'quality': this.quality,
			'announceTimeout': this.announceTimeout
        });
    };
}
