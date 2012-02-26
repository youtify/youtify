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
            Notifications.append('This address is not affiliated with Youtify. Always use www.youtify.com');
        }
    },
    loadState: function() {
        if (location.href.indexOf('playlists') !== -1 && location.href.indexOf('videos') === -1) { // /playlists/123
            loadPlaylist(URIManager.getPlaylistIdFromUrl());
        } else if (location.href.indexOf('videos') !== -1 || location.href.indexOf('tracks') !== -1) {
            if (player.initialized) {
                player.play(URIManager.getTrackFromUrl());
            } else {
                EventSystem.addEventListener('player_manager_initialized', function() {
                    player.play(URIManager.getTrackFromUrl());
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
    getTrackFromUrl: function() {
        if (location.href.indexOf('videos') !== -1) { // /playlists/123/videos/456, // /videos/456
            return new Video({
                videoId: location.href.match('videos/(.*)')[1],
                type: 'youtube'
            });
        } else if (location.href.indexOf('tracks') !== -1) { // /playlists/123/videos/456, // /videos/456
            var match = location.href.match('tracks/(.*)/(.*)');
            return new Video({
                videoId: match[2],
                type: match[1]
            });
        }
        return false;
    },
    getSearchQueryFromUrl: function() {
        return decodeURI(location.href.match('q=(.*)')[1]);
    },
    setURLFromVideo: function(video) {
        if (video.type === null || video.type.length === 0 || video.type === 'yt') {
            video.type = 'youtube';
        }
        history.pushState(null, null, '/tracks/' + video.type + '/' + video.videoId);
    }
};
    
