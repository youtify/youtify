var SettingsPopup = {

    init: function() {
        var settings = new Settings();

        if (UserManager.isLoggedIn()) {
            // LASTFM
            if (UserManager.currentUser.lastfmUserName) {
                $('<a class="title" target="_blank"></a>').attr('href', 'http://www.last.fm/user/' + UserManager.currentUser.lastfmUserName).text(UserManager.currentUser.lastfmUserName).appendTo('#settings .connections .lastfm .account');
                $('<a class="action disconnect translatable" href="/lastfm/disconnect"></a>').text(TranslationSystem.get('Disconnect')).appendTo('#settings .connections .lastfm .account');
            } else {
                $('<span class="title">Last.fm</span>').appendTo('#settings .connections .lastfm .account');
                $('<a class="action connect translatable" href="/lastfm/connect"></a>').text(TranslationSystem.get('Connect')).appendTo('#settings .connections .lastfm .account');
                $('#settings .connections .lastfm .settings input[name=lastfm_scrobble_automatically]').attr('disabled', 'disabled');
            }
            
            // DROPBOX
            if (UserManager.currentUser.dropboxUserName) {
                $('<a class="title" target="_blank"></a>').attr('href', 'https://www.dropbox.com/home').text(UserManager.currentUser.dropboxUserName).appendTo('#settings .connections .dropbox .account');
                $('<a class="action disconnect translatable" href="/api/dropbox/disconnect"></a>').text(TranslationSystem.get('Disconnect')).appendTo('#settings .connections .dropbox .account');
            } else {
                $('<span class="title">Dropbox</span>').appendTo('#settings .connections .dropbox .account');
                $('<a class="action connect translatable" href="/api/dropbox/connect"></a>').text(TranslationSystem.get('Connect')).appendTo('#settings .connections .dropbox .account');
            }
        } else {
            $('#settings .connections').hide();
            $('#settings .notifications').hide();
            $('#settings .notifications').hide();
        }

        (function() {
            var settings = new Settings();

            if (settings.lastfm_scrobble_automatically) {
                $('#settings .connections .lastfm .settings input[name=lastfm_scrobble_automatically]').attr('checked', 'checked');
            }
        }());

        $('#settings .connections .lastfm .settings input[name=lastfm_scrobble_automatically]').change(function() {
            var settings = new Settings();
            settingsFromServer.lastfm_scrobble_automatically = this.checked;
            settings.lastfm_scrobble_automatically = this.checked;
            settings.save();
        });

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
            
        // LANGUAGE

        $.each(languagesFromServer, function(i, lang) {
            var $option = $('<option></option>').attr('value', lang.code).text(lang.label);
            if (lang.code === settings.language) {
                $option.attr('selected', 'selected');
            }
            $option.appendTo('#settings .language select');
        });

        $('#settings .language select').change(function() {
            var code = $(this).val();
            var settings = new Settings();
            settings.language = code;
            settings.save();
            TranslationSystem.changeLanguage(code);
        });

        // NOTIFICATIONS

        (function () {
            var settings = new Settings();
            if (settings.send_new_follower_email) {
                $('#settings input[name=send_new_follower_email]').attr('checked', 'checked');
            }
            if (settings.send_new_subscriber_email) {
                $('#settings input[name=send_new_subscriber_email]').attr('checked', 'checked');
            }
        }());

        $('#settings input[name=send_new_follower_email]').change(function() {
            var settings = new Settings();
            settingsFromServer.send_new_follower_email = this.checked;
            settings.send_new_follower_email = this.checked;
            settings.save();
        });

        $('#settings input[name=send_new_subscriber_email]').change(function() {
            var settings = new Settings();
            settingsFromServer.send_new_subscriber_email = this.checked;
            settings.send_new_subscriber_email = this.checked;
            settings.save();
        });
    }

};
