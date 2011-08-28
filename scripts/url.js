function getPlaylistIdFromUrl() {
	if (location.href.indexOf('playlists') !== -1 && location.href.indexOf('videos') === -1) { // /playlists/123
        return location.href.match('/playlists/(.*)')[1];
    }
    return false;
}

function getVideoIdFromUrl() {
    if (location.href.indexOf('videos') !== -1) { // /playlists/123/videos/456, // /videos/456
        return location.href.match('videos/(.*)')[1];
    }
    return false;
}

function getSearchQueryFromUrl() {
    return decodeURI(location.href.match('q=(.*)')[1]);
}

function loadUrl() {
	if (location.href.indexOf('playlists') !== -1 && location.href.indexOf('videos') === -1) { // /playlists/123
		loadPlaylist(getPlaylistIdFromUrl());
    } else if (location.href.indexOf('videos') !== -1) {
		Player.play(getVideoIdFromUrl());
    } else if (location.href.indexOf('search') !== -1) {
        $('#search input').val(getSearchQueryFromUrl()).keyup();
    }
}
