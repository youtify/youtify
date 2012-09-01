var HomeScreen = {
    $rightView: null,
    $artists: null,
    $recommendations: null,
    $playlists: null,
    menuItem: null,
    tabs: null,
    
    init: function() {
        var self = HomeScreen;
        self.$rightView = $('#right > .home');
        self.$recommendations = self.$rightView.find('.pane.recommendations');
        self.$playlists = self.$rightView.find('.pane.playlists');
        self.$artists = self.$rightView.find('.pane.artists');
        self.menuItem = new MenuItem({
            cssClasses: ['home'],
            title: TranslationSystem.get('Home'),
            $contentPane: self.$rightView,
            onSelected: function() {
                HomeScreen.show();
            },
            translatable: true
        });
        Menu.getGroup('misc').addMenuItem(self.menuItem);

        self.tabs = new Tabs(self.$rightView, {
            'artists': self.loadArtists,
            'playlists': self.loadTopPlaylists,
            'recommendations': self.loadRecommendedArtists
        });
    },

    show: function(tab) {
        var self = HomeScreen;
        tab = tab || 'artists';
        history.pushState(null, null, '/');
        self.$rightView.find('.tabs .' + tab).click();

        $('#right > div').hide();
        self.$rightView.show();
    },

    loadRecommendedArtists: function() {
        var self = HomeScreen;
        var $content = self.$recommendations.find('.content');

        history.pushState(null, null, '/recommendations');

        $content.html('');
        self.$recommendations.find('.help-box').hide();
        console.log($content);

        if (!UserManager.isLoggedIn()) {
            self.$recommendations.find('.help-box.not-logged-in').show();
        } else if (!UserManager.currentUser.lastfmUserName) {
            self.$recommendations.find('.help-box.not-connected-to-lastfm').show();
        } else {
            Recommendations.findRecommendedArtists(function(artists) {
                $.each(artists, function(i, artist) {
                    if (artist.name) {
                        var artistSuggestion = new ArtistSuggestion({
                            name: artist.name,
                            imageUrl: artist.image[2]['#text'],
                            mbid: artist.mbid
                        });
                        $content.append(artistSuggestion.getSmallView()).show();
                    }
                });
            });
        }
    },

    loadTopPlaylists: function() {
        var self = HomeScreen;

        self.$playlists.html('');

        history.pushState(null, null, '/toplist/playlists');

        LoadingBar.show();
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

    loadArtists: function() {
        var self = HomeScreen,
            i = 0,
            artist = null,
            nbrOfArtists = 50;

        self.$artists.html('');

        history.pushState(null, null, '/');
        
        LoadingBar.show();
        $.getJSON('/api/external_users/top/' + nbrOfArtists, function(data) {
            LoadingBar.hide();
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
                self.$artists.append($item);
            });
        });
    }    
};
