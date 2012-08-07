function Settings() {
    var settings = JSON.parse(localStorage.settings || '{}');

    this.language = settings.language || autoDetectedLanguageByServer;
	this.enableTranslationTool = settings.enableTranslationTool || false;
	this.quality = settings.quality || 'hd720';
	this.announceTimeout = settings.announceTimeout || 3000;
    this.send_new_follower_email = settingsFromServer.send_new_follower_email;
    this.send_new_subscriber_email = settingsFromServer.send_new_subscriber_email;
    this.flattr_automatically = settingsFromServer.flattr_automatically;
    this.lastfm_scrobble_automatically = settingsFromServer.lastfm_scrobble_automatically;

    this.save = function() {
        localStorage.settings = JSON.stringify({
            'language': this.language,
            'enableTranslationTool': this.enableTranslationTool,
			'quality': this.quality,
			'announceTimeout': this.announceTimeout
        });

        if (logged_in) {
            LoadingBar.show();

            params = {
                 flattr_automatically: this.flattr_automatically,
                 lastfm_scrobble_automatically: this.lastfm_scrobble_automatically,
                 send_new_follower_email: this.send_new_follower_email,
                 send_new_subscriber_email: this.send_new_subscriber_email
            };

            $.post('/me/settings', params, function(data) {
                LoadingBar.hide();
            });
        }
    };
}
