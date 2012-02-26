/*global

$: true,
ON_PRODUCTION: true,
Notifications: true,
Settings: true,
PlaylistsManager: true,
volume_Init: true,
translations_Init: true,
spotifyImport_Init: true,
settings_Init: true,
search_Init: true,
queue_Init: true,
ping_Init: true,
url_Init: true,

*/

// GLOBALS
var playlistManager;
var youTubeApiReady = false;
var player = null;
var SOUNDCLOUD_API_KEY = '206f38d9623048d6de0ef3a89fea1c4d';
var OFFICIALFM_API_KEY = 'gLc8fHvg39ez6EAYvxFA';

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
    var settings = new Settings();
	
    EventSystem.init();
    Menu.init();

    playlistManager = new PlaylistsManager();

	volume_Init();
	translations_Init();
    spotifyImport_Init();
    settings_Init();
    Search.init();
    Queue.init();
    ping_Init();
    Notifications.init();
    webstore_Init();
    player = new PlayerManager();
    player.init();
    Timeline.init();
    InfoPopup.init();
    VideoInfo.init();
    FlattrFinder.init();
    BottomPanel.init();
    Window.init();
    TopMenu.init();
    url_Init();
});

function onYouTubePlayerAPIReady() {
    youTubeApiReady = true;
	// 
	// Player cannot be loaded before
	// $(window).load()
}
