// GLOBALS
var playlistManager;
var youTubeApiReady = false;
var player = null;
var ECHONEST_API_KEY = 'GWFNOCZP6DVXYN4RT';
var SOUNDCLOUD_API_KEY = '206f38d9623048d6de0ef3a89fea1c4d';
var OFFICIALFM_API_KEY = 'gLc8fHvg39ez6EAYvxFA';
var LASTFM_API_KEY = 'efe2adba16c8a466ea98520a8a3c5903';
var selectedVideoElements = [];

// Globals set by /api/main
var settingsFromServer = {};
var lastAction; // Action to be repeated if a playlist sync has been required
var languagesFromServer;
var autoDetectedLanguageByServer;
var autoDetectedTranslations;
var ON_PRODUCTION;
var myFollowers;
var myFollowings;

if (window.API_HOST === undefined) { // This is set for the Chrome Web App
    window.API_HOST = '';
}

soundManager.url = '/scripts/swf/';
soundManager.flashVersion = 9;
soundManager.debugMode = false;

$(document).ajaxError(function (e, r, ajaxOptions, thrownError) {
    if (r.status === 500 && $.trim(r.responseText).length > 0) {
        if (ON_PRODUCTION) {
            Notifications.append('Connection error! <i>' + r.responseText + '</i>');
        } else {
            $('body').html(r.responseText);
        }
    }
    // 409 is used for device conflicts which we handle (see
    // PlaylistManager.reloadAndPerformLastAction).
    if (r.status !== 409) {
        LoadingBar.error();
    }
});

$(document).ready(function() {
    EventSystem.init();
    Menu.init();
    LoadingBar.init();
    WindowEvents.init();
    Logo.init();
    LayoutManager.init();

    $.getJSON(API_HOST + '/api/main', function(data) {
        settingsFromServer = data.settingsFromServer;
        languagesFromServer = data.languagesFromServer;
        autoDetectedLanguageByServer = data.autoDetectedLanguageByServer;
        autoDetectedTranslations = data.autoDetectedTranslations;
        ON_PRODUCTION = data.ON_PRODUCTION;
        myFollowers = data.myFollowers;
        myFollowings = data.myFollowings;

        SyncManager.init(data.device, data.lastNotificationSeenTimestamp);
        UserManager.init(data.user);
        TopMenu.init();

        $('body').addClass('loaded');
        $('#top .login-link').attr('href', data.loginUrl);
        $('#profile-popup .logout a').attr('href', data.logoutUrl);

        playlistManager = new PlaylistsManager();
        Volume.init();
        TranslationSystem.init();
        SpotifyImporterPopup.init();
        SettingsPopup.init();
        Search.init();
        HomeScreen.init();
        Queue.init();
        Ping.init();
        Notifications.init();
        player = new PlayerManager();
        player.init();
        Timeline.init();
        InfoPopup.init();
        InfoFetcher.init();
        Recommendations.init();
        FlattrFinder.init();
        AutoFlattrer.init();
        Lastfm.init();
        EchoNest.init();
        BottomPanel.init();
        ExternalUserPage.init();
        ExternalUserManager.init();
        URIManager.init();
        FullScreen.init();
    });
    
    $('.login-link').click(LoadingBar.show);

    $('.playlists').click(function(event) {
        if ($(event.target).hasClass('playlists')) {
            Utils.deSelectSelectedVideos();
        }
    });
});

function onYouTubePlayerAPIReady() {
    youTubeApiReady = true;
	// 
	// Player cannot be loaded before
	// $(window).load()
}
