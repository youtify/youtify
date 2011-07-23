function cleanupSearchOptionsLocalStorage() {
    localStorage.removeItem('search-options-songs');
    localStorage.removeItem('search-options-playlists');
}

function migratePlaylistFormat() {
    var playlists = JSON.parse(localStorage['playlists'] || '[]'),
        playlist,
        i = 0;

    for (i = 0; i < playlists.length; i += 1) {
        playlist = playlists[i]; 
        if (playlist.songs !== undefined) {
            playlist.videos = playlist.songs;
            delete playlist.songs;
        }
        if ('beta_youtube_sync' in localStorage) {
            if (playlist.remoteID === undefined) {
                playlist.remoteID = null;
            }
            if (playlist.isPrivate === undefined) {
                playlist.isPrivate = false;
            }
        }
    }

    localStorage['playlists'] = JSON.stringify(playlists);
}

function createBackup() {
    var backups = JSON.parse(localStorage['backups'] || '{}'),
        date = '2011-06-29';

    if (!(date in backups)) {
        backups[date] = JSON.parse(localStorage['playlists'] || '[]'); // Must parse so that later stringify won't doubly stringify
    }

    localStorage['backups'] = JSON.stringify(backups);
}

function migrateThemeSettings() {
    var settings = JSON.parse(localStorage['settings'] || '{}');
    
    if ('theme' in localStorage) {
        settings['theme'] = localStorage['theme'];
        localStorage.removeItem('theme');
    }

    localStorage['settings'] = JSON.stringify(settings);
}

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

createBackup();
cleanupSearchOptionsLocalStorage();
migratePlaylistFormat();
migrateThemeSettings();
prefixWithLoggedOut();
