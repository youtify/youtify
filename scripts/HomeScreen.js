var HomeScreen = {
    $rightView: null,
    $recommendations: null,
    $playlists: null,
    menuItem: null,
    nbrOfArtists: 0,
    
    init: function() {
        this.$rightView = $('#right > .home');
        this.$recommendations = $('#right > .home .recommendations');
        this.$playlists = $('#right > .home .playlists');
        this.menuItem = new MenuItem({
            cssClasses: ['home'],
            title: TranslationSystem.get('Home'),
            $contentPane: this.$rightView,
            onSelected: function() {
                HomeScreen.show();
            },
            translatable: true
        });
        Menu.getGroup('misc').addMenuItem(this.menuItem);
    },

    show: function() {
        history.pushState(null, null, '/');
        this.reset();
        this.$rightView.show();
        HomeScreen.loadSpotlight();
        HomeScreen.loadTopPlaylists();
        if (lastfm_user_name) {
            HomeScreen.loadRecommendedArtists();
        }
    },

    reset: function() {
        this.$recommendations.html('');
        this.$playlists.html('');
    },

    loadRecommendedArtists: function() {
        var self = this;
        Recommendations.findRecommendedArtists(function(artists) {
            console.log(artists);
            $.each(artists, function(i, artist) {
                if (artist.name) {
                    var artistSuggestion = new ArtistSuggestion({
                        name: artist.name,
                        imageUrl: artist.image[1]['#text'],
                        mbid: artist.mbid
                    });
                    self.$recommendations.append(artistSuggestion.getSmallView());
                }
            });
        });
    },

    loadTopPlaylists: function() {
        var self = this;
        $.get('/api/toplists/playlists', function(playlists) {
            $.each(playlists, function(index, item) {
                var playlist = new Playlist(item.title, item.videos, item.remoteId, item.owner, item.isPrivate, item.followers);
                if (playlist.videos.length) {
                    self.$playlists.append(PlaylistView.createSmallPlaylistView(playlist));
                }
            });
            LoadingBar.hide();
        });
    },

    loadSpotlight: function() {
        var self = this,
            i = 0,
            artist = null,
            $spinner = self.$rightView.find('.spinner .inner'),
            width = $('#right > .home .spinner').width() * 1.15, 
            itemWidth = 88,
            rows = 3,
            nbrOfArtists = 0;
        width = width < 528 ? 528 : width;
        nbrOfArtists = Math.ceil(width/itemWidth) * rows;
        
        if (self.nbrOfArtists === nbrOfArtists) {
            return;
        } else {
            self.nbrOfArtists = nbrOfArtists;
            $spinner.html('');
        }
        
        $.getJSON('/api/external_users/top/' + nbrOfArtists, function(data) {
            $.each(data, function(i, externalUser) {
                if (!externalUser.avatar_url) {
                    return;
                }
                var $item = $('<div class="item"/>'),
                    $title = $('<div class="title"/>'),
                    image = new Image();
                
                image.onload = function() {
                    $item.css({'opacity': '1'});
                };
                image.src = externalUser.avatar_url;
                $item.css({'background-image': 'url('+ externalUser.avatar_url + ')'});
                $item.click(function() {
                    ExternalUserPage.load(externalUser.type, externalUser.username);
                });
                $title.text(externalUser.username);
                $item.append($title);
                $spinner.append($item);
            });
        });
    }    
};
