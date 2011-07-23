function prefixWithLoggedOut() {
    var playlists = localStorage['playlists'] || '[]';
        settings = localStorage['settings'] || '{}';

    if (localStorage['loggedOut'] === undefined) {
        localStorage['loggedOut'] = '{"playlists":' + playlists + ', "settings":' + settings + '}';

        if (localStorage['settings'] !== undefined) {
            localStorage.removeItem('settings');
        }

        if (localStorage['playlists'] !== undefined) {
            localStorage.removeItem('playlists');
        }
    }
}

prefixWithLoggedOut();
