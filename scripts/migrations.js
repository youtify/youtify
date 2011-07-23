function prefixWithLoggedOut() {
    if (localStorage['settings'] !== undefined) {
        localStorage['loggedOutSettings'] = localStorage['settings'];
        localStorage.removeItem('settings');
    }

    if (localStorage['playlists'] !== undefined) {
        localStorage['loggedOutPlaylists'] = localStorage['playlists'];
        localStorage.removeItem('playlists');
    }
}

prefixWithLoggedOut();
