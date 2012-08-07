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

        var title = video.title

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

    findSimilarArtistsFromName: function(name) {
        var self = this;
        var url = "http://ws.audioscrobbler.com/2.0?callback=?";
        var params = {
            method: 'artist.getsimilar',
            format: 'json',
            limit: 30,
            artist: name,
            api_key: 'b25b959554ed76058ac220b7b2e0a026' // @TODO change
        };

        self.reset();

        LoadingBar.show();
        $.getJSON(url, params, function(data) {
            LoadingBar.hide();
            console.log('response', data);
            if (!data.similarartists || typeof(data.similarartists.artist) !== "object") {
                alert('Could not find any similar artists to ' + name);
                return;
            }
            $.each(data.similarartists.artist, function(i, artist) {
                if (artist.mbid) {
                    var artistSuggestion = new ArtistSuggestion({
                        name: artist.name,
                        imageUrl: artist.image[1]['#text'],
                        mbid: artist.mbid,
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
        var self = this;
        var $view = $('<div class="suggestion artist"></div>');

        $('<img/>').attr('src', this.imageUrl).appendTo($view);
        $('<span class="link name"></span>').text(this.name).appendTo($view);

        $view.click(function() {
            self.goTo();
        });

        return $view;
    };

    this.goTo = function() {
        $('#top .search input').val(this.name).keyup();
    };
};
