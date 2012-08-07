var Lastfm = {
    init: function() {
        EventSystem.addEventListener('song_almost_done_playing', function(data) {
            if (has_lastfm_access_token && settingsFromServer.lastfm_scrobble_automatically) {
                Lastfm.scrobble(data);
            }
        });
    },

    scrobble: function(data) {
        var options = Utils.getArtistAndTrackNames(data);
        
        if (options) {
            options.timestamp = (((new Date).getTime() / 1000) >> 0); // TODO: Fix before 2038

            $.post('/lastfm/scrobble', options, function(data) {
                var success = data['success']
                
                if (data['success']) {
                    var scrobble = data['result']
                    
                    console.log('Scrobbled \'' + scrobble.track['#text'] + '\' by \'' + scrobble.artist['#text'] + '\'');
                } else {
                    console.log('Failed to scrobble')
                }
            });
        } else {
            console.log('Could not scrobble, could not find artist and title');
        }
    }
};
