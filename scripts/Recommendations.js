var Recommendations = {
    $popup: null,
    $popupContent: null,
    $popupLoadingAnimation: null,
    
    init: function() {
        this.$popup = $('#similar-artists-popup');
        this.$popupContent = this.$popup.find('.content');
        this.$popupLoadingAnimation = this.$popup.find('.loading-animation');
    },

    /**
     * Get recommended artists based on your scrobble data.
     */
    findRecommendedArtists: function(callback) {
        var self = this;

        LoadingBar.show();
        $.getJSON('/lastfm/recommendations', {}, function(data) {
            LoadingBar.hide();

            if (data.success) {
                callback(data.artists);
            } else {
                console.log('Failed to load recommendations…');
            }
        });
    },

    loadSimilarArtistsPopup: function(externalUser) {
        var self = this;
        var name = externalUser.displayName;
        var url = "http://ws.audioscrobbler.com/2.0?callback=?";
        var params = {
            method: 'artist.getsimilar',
            format: 'json',
            limit: 30,
            artist: name,
            api_key: LASTFM_API_KEY
        };

        self.$popupContent.html('');
        self.$popupLoadingAnimation.show();

        $.getJSON(url, params, function(data) {
            self.$popup.find('.loading-animation').hide();
            if (!data.similarartists || typeof(data.similarartists.artist) !== "object") {
                self.$popupContent.text(TranslationSystem.get('Could not find any artists similar to $artistName.', {$artistName: name}));
                return;
            }
            $.each(data.similarartists.artist, function(i, artist) {
                if (artist.mbid) {
                    var artistSuggestion = new ArtistSuggestion({
                        name: artist.name,
                        imageUrl: artist.image[1]['#text'],
                        mbid: artist.mbid
                    });
                    self.$popupContent.append(artistSuggestion.getSmallView());
                }
            });
        });
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
            Utils.closeAnyOpenArrowPopup();
            self.goTo();
        });

        return $view;
    };

    this.goTo = function() {
        $('#top .search input').val(this.name).keyup();
    };
}
