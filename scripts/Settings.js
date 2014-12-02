function Settings() {
    var settings = JSON.parse(localStorage.settings || '{}');

    this.language = settings.language || autoDetectedLanguageByServer;
	this.enableTranslationTool = settings.enableTranslationTool || false;
	this.quality = settings.quality || 'hd720';
	this.announceTimeout = settings.announceTimeout || 3000;
    this.send_new_follower_email = settingsFromServer.send_new_follower_email;
    this.send_new_subscriber_email = settingsFromServer.send_new_subscriber_email;
    this.lastfm_scrobble_automatically = settingsFromServer.lastfm_scrobble_automatically;
    this.shuffle = settings.shuffle || false;

    this.saveLocal = function(){
        localStorage.settings = JSON.stringify({
            'language': this.language,
            'enableTranslationTool': this.enableTranslationTool,
            'quality': this.quality,
            'announceTimeout': this.announceTimeout,
            'shuffle': this.shuffle
        });
    };

    this.save = function() {
        this.saveLocal();

        if (UserManager.isLoggedIn()) {
            LoadingBar.show();

            params = {
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
