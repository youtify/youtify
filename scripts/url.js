function url_Init() {
    URIManager.init();
}

var URIManager = {
    init: function() {
        URIManager.loadWarnings();
        URIManager.loadState();
        EventSystem.addEventListener('video_started_playing_successfully', function(video) {
            URIManager.setURLFromVideo(video);
        });
    },
    loadWarnings: function() {
        if (window.top !== window.self) {
            Notification.say('This address is not affiliated with Youtify. Always use www.youtify.com');
        }
    },
    loadState: function() {
        if (location.href.indexOf('playlists') !== -1 && location.href.indexOf('videos') === -1) { // /playlists/123
            loadPlaylist(URIManager.getPlaylistIdFromUrl());
        } else if (location.href.indexOf('videos') !== -1 || location.href.indexOf('track') !== -1) {
            if (player.initialized) {
                player.play(new Video(URIManager.getVideoIdFromUrl()));
            } else {
                EventSystem.addEventListener('player_initialized', function() {
                    player.play(new Video(URIManager.getVideoIdFromUrl()));
                });
            }
        } else if (location.href.indexOf('search') !== -1) {
            $('#search input').val(URIManager.getSearchQueryFromUrl()).keyup();
        } else {
            Menu.find('toplist').select();
        }
    },
    getPlaylistIdFromUrl: function() {
        if (location.href.indexOf('playlists') !== -1 && location.href.indexOf('videos') === -1) { // /playlists/123
            return location.href.match('/playlists/(.*)')[1];
        }
        return false;
    },
    getVideoIdFromUrl: function() {
        if (location.href.indexOf('videos') !== -1) { // /playlists/123/videos/456, // /videos/456
            return location.href.match('videos/(.*)')[1];
        } else if (location.href.indexOf('track') !== -1) { // /playlists/123/videos/456, // /videos/456
            return location.href.match('track/(.*)/(.*)')[2];
        }
        return false;
    },
    getSearchQueryFromUrl: function() {
        return decodeURI(location.href.match('q=(.*)')[1]);
    },
    setURLFromVideo: function(video) {
        if (video.type === null || video.type.length === 0) {
            video.type = 'yt';
        }
        history.pushState(null, null, '/track/' + video.type + '/' + video.videoId);
    }
};
    
