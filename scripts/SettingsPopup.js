var SettingsPopup = {
    chromeWebStoreAppLink: 'https://chrome.google.com/webstore/detail/ceimdjnelbadcaempefhdpdhdokpnbho',
    puffs: [],

    init: function() {
        var settings = new Settings();
        var numberOfUnseenPuffs = 0;
        var viewedPuffs = JSON.parse(localStorage.viewedPuffs || '[]');
        var rel;

        // PUFFS

        if (SettingsPopup.isBrowserChrome() && !SettingsPopup.isChromeWebStoreAppInstalled()) {
            rel = '.chrome-webstore';
            if (viewedPuffs.indexOf(rel) === -1) {
                numberOfUnseenPuffs += 1;
            }
            $('#settings .puffs .chrome-webstore').attr('rel', rel).click(function(event) {
                event.preventDefault();
                SettingsPopup.installChromeWebStoreApp();
            });
            SettingsPopup.puffs.push(rel);
        } else {
            $('#settings .puffs .chrome-webstore').hide();
        }

        if (SettingsPopup.puffs.length) {
            $('#settings .puffs').show();
        }

        if (numberOfUnseenPuffs > 0) {
            $('#top .menu .settings .counter').text(numberOfUnseenPuffs).show();
        }

        // FLATTR

        if (has_flattr_access_token) {
            $('<a class="title" target="_blank"></a>').attr('href', 'https://flattr.com/profile/' + flattr_user_name).text(flattr_user_name).appendTo('#settings .connections .flattr .account');
            $('<a class="button disconnect translatable" href="/flattrdisconnect"></a>').text(TranslationSystem.get('Disconnect')).appendTo('#settings .connections .flattr .account');
        } else {
            $('<span class="title">Flattr</span>').appendTo('#settings .connections .flattr .account');
            $('<a class="button connect translatable" href="/flattrconnect"></a>').text(TranslationSystem.get('Connect')).appendTo('#settings .connections .flattr .account');
            $('#settings .connections .flattr .settings input[name=flattr_automatically]').attr('disabled', 'disabled');
        }

        (function() {
            var settings = new Settings();
            if (settings.flattr_automatically) {
                $('#settings .connections .flattr .settings input[name=flattr_automatically]').attr('checked', 'checked');
            }
        }());

        $('#settings .connections .flattr .settings input[name=flattr_automatically]').change(function() {
            var settings = new Settings();
            settingsFromServer.flattr_automatically = this.checked;
            settings.flattr_automatically = this.checked;
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
    },

    getNumberOfUnseenPuffs: function() {
        var viewedPuffs = JSON.parse(localStorage.viewedPuffs || '[]');
        var count = 0;
        $.each($('#settings .puffs .puff'), function(i, $puff) {
            if (viewedPuffs.indexOf($puff.rel) === -1) {
                count += 1;
            }
        });
        return count;
    },

    markAllPuffsAsSeen: function() {
        var json = [];
        $.each($('#settings .puffs .puff'), function(i, $puff) {
            json.push($puff.rel);
        });
        localStorage.viewedPuffs = JSON.stringify(json);
        $('#top .menu .settings .counter').hide();
    },

    isBrowserChrome: function() {
        return navigator && navigator.userAgent && navigator.userAgent.indexOf('Chrome') !== -1;
    },

    isChromeWebStoreAppInstalled: function() {
        return window.chrome && window.chrome.app && window.chrome.app.isInstalled;
    },

    installChromeWebStoreApp: function() {
        var fail = function() {
                Notifications.append('Failed to install App.');
            },
            success = function() {
                Notifications.append('Installation succeded!');
                $('#settings .puffs .chrome-webstore').hide();
            };
        if (window.chrome && window.chrome.webstore) {
            window.chrome.webstore.install(SettingsPopup.chromeWebStoreAppLink, success, fail);
        } else {
            fail();
        }
    }
};
