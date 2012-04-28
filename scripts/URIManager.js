var URIManager = {
    initialPopStateHasRun: false,

    init: function() {
        window.addEventListener('popstate', function(event) {
            // Chrome throws an initial popState, http://dropshado.ws/post/15251622664/ignore-initial-popstate
			var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
            if (isChrome && !URIManager.initialPopStateHasRun) {
                URIManager.initialPopStateHasRun = true;
                return;
            }
            URIManager.loadState();
        });
        URIManager.loadWarnings();
        URIManager.loadState();
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
            $('#top .search input').val(URIManager.getSearchQueryFromUrl()).keyup();
        } else if (location.href.indexOf('profile') !== -1) {
            Menu.profile.select();
        } else if (location.href.indexOf('users') !== -1) {
            UserManager.doFakeProfileMenuClick();
            UserManager.loadProfile((URIManager.getUserFromUrl()));
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
    getUserFromUrl: function() {
        return decodeURI(location.href.match('/users/(.*)')[1]);
    },
    getSearchQueryFromUrl: function() {
        return decodeURI(location.href.match('q=(.*)')[1]);
    },
};
    
