function Settings() {
    var settings = JSON.parse(localStorage.settings || '{}');

    this.language = settings.language || autoDetectedLanguageByServer;
	this.enableTranslationTool = settings.enableTranslationTool || false;
	this.quality = settings.quality || 'hd720';
	this.announceTimeout = settings.announceTimeout || 3000;
    this.send_new_follower_email = settingsFromServer.send_new_follower_email;
    this.send_new_subscriber_email = settingsFromServer.send_new_subscriber_email;

    this.save = function() {
        localStorage.settings = JSON.stringify({
            'language': this.language,
            'enableTranslationTool': this.enableTranslationTool,
			'quality': this.quality,
			'announceTimeout': this.announceTimeout
        });

        LoadingBar.show();

        params = {
             send_new_follower_email: this.send_new_follower_email,
             send_new_subscriber_email: this.send_new_subscriber_email
        };

        $.post('/me/settings', params, function(data) {
            LoadingBar.hide();
        });
    };
}
