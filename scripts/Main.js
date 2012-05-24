// GLOBALS
var playlistManager;
var youTubeApiReady = false;
var player = null;
var SOUNDCLOUD_API_KEY = '206f38d9623048d6de0ef3a89fea1c4d';
var OFFICIALFM_API_KEY = 'gLc8fHvg39ez6EAYvxFA';
var selectedVideoElements = [];

$(document).ajaxError(function (e, r, ajaxOptions, thrownError) {
    if (r.status === 500 && $.trim(r.responseText).length > 0) {
        if (ON_PRODUCTION) {
            Notifications.append('Connection error! <i>' + r.responseText + '</i>');
        } else {
            $('body').html(r.responseText);
        }
    }
});

$(document).ready(function() {
    EventSystem.init();
    Menu.init();

    playlistManager = new PlaylistsManager();

    LoadingBar.init();
	Volume.init();
	TranslationSystem.init();
    SpotifyImporterPopup.init();
    SettingsPopup.init();
    Search.init();
    Queue.init();
    Ping.init();
    Notifications.init();
    ChromeWebStore.init();
    player = new PlayerManager();
    player.init();
    Timeline.init();
    InfoPopup.init();
    VideoInfo.init();
    FlattrFinder.init();
    BottomPanel.init();
    UserManager.init(USER);
    TopMenu.init();
    URIManager.init();
});

function onYouTubePlayerAPIReady() {
    youTubeApiReady = true;
	// 
	// Player cannot be loaded before
	// $(window).load()
}
