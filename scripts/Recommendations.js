var Recommendations = {
    $rightView: null,
    
    init: function() {
        this.$rightView = $('#right > .recommendations');
        this.$tracklist = $('#right > .recommendations .tracklist');
    },

    show: function() {
        history.pushState(null, null, '/');
        $('#right > div').hide();
        Menu.deSelect();
        this.$rightView.show();
    },

    reset: function() {
        this.$tracklist.html('');
    },

    findSimilarTracksFromTitle: function(title) {
        var self = this;
        var artistAndTrack = Utils.getArtistAndTrackNames(title);

        if (!artistAndTrack) {
            alert('Could not extract artist and title from ' + title);
            return;
        }

        var url = "http://ws.audioscrobbler.com/2.0?callback=?";
        var params = {
            method: 'track.getsimilar',
            format: 'json',
            limit: 30,
            artist: artistAndTrack.artist,
            track: artistAndTrack.track,
            api_key: 'b25b959554ed76058ac220b7b2e0a026' // @TODO change
        };

        console.log('Looking for alternatives to', artistAndTrack.artist, artistAndTrack.track)

        self.reset();

        LoadingBar.show();
        $.getJSON(url, params, function(data) {
            LoadingBar.hide();
            console.log('response', data);
            if (typeof(data.similartracks.track) !== "object") {
                alert('Could not find any similar tracks to ' + artistAndTrack.artist + ' - ' + artistAndTrack.track);
                return;
            }
            $.each(data.similartracks.track, function(i, track) {
                var video = new Video({
                    title: track.artist.name + ' - ' + track.name,
                    type: 'unresolved'
                });
                self.$tracklist.append(video.createListView());
            });
        });

        self.show();
    },
    
    findSimilarTracks: function(video) {
        return this.findSimilarTracksFromTitle(video.title);
    }    
};
