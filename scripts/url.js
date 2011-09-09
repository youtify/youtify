function url_Init() {
    URIManager.init();
}

var URIManager = {
    init: function() {
        URIManager.loadWarnings();
        URIManager.loadState();
    },
    loadWarnings: function() {
        var domainwarning = 'domainwarning?domain=';
        if (location.href.indexOf(domainwarning) > 0) {
            Notification.show(decodeURI(location.href.substring(domainwarning.length + location.href.indexOf(domainwarning))) + ' is not affiliated with Youtify. Always use <a href="http://www.youtify.com/">http://www.youtify.com/</a>');
        }
    },
    loadState: function() {
        if (location.href.indexOf('playlists') !== -1 && location.href.indexOf('videos') === -1) { // /playlists/123
            loadPlaylist(URIManager.getPlaylistIdFromUrl());
        } else if (location.href.indexOf('videos') !== -1) {
            Player.play(URIManager.getVideoIdFromUrl());
        } else if (location.href.indexOf('search') !== -1) {
            $('#search input').val(URIManager.getSearchQueryFromUrl()).keyup();
        } else {
            TopList.select();
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
        }
        return false;
    },
    getSearchQueryFromUrl: function() {
        return decodeURI(location.href.match('q=(.*)')[1]);
    }
};
    
