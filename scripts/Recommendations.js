var Recommendations = {
    $rightView: null,
    
    init: function() {
        this.$rightView = $('#right > .recommendations');
        this.$tracklist = $('#right > .recommendations .tracklist');
        this.$artistList = $('#right > .recommendations .artists');
    },

    show: function() {
        history.pushState(null, null, '/');
        $('#right > div').hide();
        Menu.deSelect();
        this.$rightView.show();
    },

    reset: function() {
        this.$tracklist.html('').hide();
        this.$artistList.html('').hide();
    },

    findSimilarTracks: function(video) {
        var self = this;
        var artistAndTrack = Utils.getArtistAndTrackNames(video);

        if (!artistAndTrack) {
            alert('Could not extract artist and title from ' + video.title);
            return;
        }

        var url = "http://ws.audioscrobbler.com/2.0?callback=?";
        var params = {
            method: 'track.getsimilar',
            format: 'json',
            limit: 30,
            artist: artistAndTrack.artist,
            track: artistAndTrack.track,
            api_key: LASTFM_API_KEY
        };

        console.log('Looking for alternatives to', artistAndTrack.artist, artistAndTrack.track);

        self.reset();

        LoadingBar.show();
        $.getJSON(url, params, function(data) {
            LoadingBar.hide();
            if (!data.similartracks || typeof(data.similartracks.track) !== "object") {
                alert('Could not find any similar tracks to ' + artistAndTrack.artist + ' - ' + artistAndTrack.track);
                return;
            }
            $.each(data.similartracks.track, function(i, track) {
                if (track.mbid) {
                    var video = new Video({
                        title: track.artist.name + ' - ' + track.name,
                        mbid: track.mbid,
                        type: 'unresolved'
                    });
                    self.$tracklist.append(video.createListView());
                }
            });
        });

        self.$tracklist.show();
        self.show();
    },

    findRecommendedArtists: function(callback) {
        var self = this;

        self.reset();

        LoadingBar.show();
        $.getJSON('/lastfm/recommendations', {}, function(data) {
            LoadingBar.hide();

            if (data.success) {
                callback(data.artists);
            } else {
                console.log('Failed to load recommendations…');
            }
        });

        self.$artistList.show();
        self.show();
    },

    findSimilarArtistsFromName: function(name) {
        var self = this;
        var url = "http://ws.audioscrobbler.com/2.0?callback=?";
        var params = {
            method: 'artist.getsimilar',
            format: 'json',
            limit: 30,
            artist: name,
            api_key: LASTFM_API_KEY
        };

        self.reset();

        LoadingBar.show();
        $.getJSON(url, params, function(data) {
            LoadingBar.hide();
            if (!data.similarartists || typeof(data.similarartists.artist) !== "object") {
                alert('Could not find any similar artists to ' + name);
                return;
            }
            $.each(data.similarartists.artist, function(i, artist) {
                if (artist.mbid) {
                    var artistSuggestion = new ArtistSuggestion({
                        name: artist.name,
                        imageUrl: artist.image[1]['#text'],
                        mbid: artist.mbid
                    });
                    self.$artistList.append(artistSuggestion.getSmallView());
                }
            });
        });

        self.$artistList.show();
        self.show();
    },

    findSimilarArtists: function(externalUser) {
        return this.findSimilarArtistsFromName(externalUser.displayName);
    }
};

function ArtistSuggestion(args) {
    this.mbid = args.mbid;
    this.name = args.name;
    this.imageUrl = args.imageUrl;

    this.getSmallView = function() {
        var self = this,
            $view = $('<div class="suggestion artist"></div>'),
            image = new Image();
        image.onload = function() {
            $view.css({'opacity': '1'});
        };
        image.src = this.imageUrl;
        
        $view.css({'background-image': 'url('+ this.imageUrl + ')'});
        $('<span class="link name"></span>').text(this.name).appendTo($view);

        $view.click(function() {
            self.goTo();
        });

        return $view;
    };

    this.goTo = function() {
        $('#top .search input').val(this.name).keyup();
    };
}
