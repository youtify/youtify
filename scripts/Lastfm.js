var Lastfm = {
    lastOptions: null,
    init: function() {
        EventSystem.addEventListener('song_almost_done_playing', function(data) {
            if (UserManager.isLoggedIn() && UserManager.currentUser.lastfmUserName && settingsFromServer.lastfm_scrobble_automatically) {
                Lastfm.scrobble(data);
            }
        });
    },

    scrobble: function(data) {
        var options = Utils.getArtistAndTrackNames(data);
        
        /* Don't scrobble duplicates */
        if (Lastfm.lastOptions && options &&
            Lastfm.lastOptions.artist === options.artist &&
            Lastfm.lastOptions.track === options.track) {
            return;
        }
        
        if (options) {
            options.timestamp = (((new Date()).getTime() / 1000) >> 0); // TODO: Fix before 2038

            $.post('/lastfm/scrobble', options, function(data) {
                if (data.success) {
                    var scrobble = data.result;
                    
                    console.log('Scrobbled \'' + scrobble.track['#text'] + '\' by \'' + scrobble.artist['#text'] + '\'');
                } else {
                    console.log('Failed to scrobble');
                }
            });
        } else {
            console.log('Could not scrobble, could not find artist and title');
        }
    }
};
