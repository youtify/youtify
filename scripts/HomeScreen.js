var HomeScreen = {
    $rightView: null,
    $artists: null,
    $recommendations: null,
    $playlists: null,
    menuItem: null,
    tabs: null,
    page: -1,
    hasMore: true,
    FILTER: [
        /* Not music */
        'dignitasApollo',
        'mrcoolvideoboy',
        'huskystarcraft',
        'husky',
        'collegehumor',
        'day9tv',
        /* Unplayable */
        'monstercatmedia',
        'lanadelreyunreleased' 
    ],
    
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

        // Continous scroll for "Popular artists"
        (function() {
            var timeout;
            self.$rightView.scroll(function(event) {
                if (timeout) {
                    clearTimeout(timeout);
                }
                timeout = setTimeout(function() {
                    if (self.$rightView.scrollTop() >= (self.$artists.height() - self.$rightView.height()) && self.hasMore) {
                        self.loadArtists(true);
                    }
                }, 100);
            });
        }());
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

    videoPlayCallback: function() {
        HomeScreen.menuItem.setAsPlaying();
    },

    addArtist: function(externalUser) {
        var self = this;

        if (!externalUser.avatar_url) {
            return;
        }

        // If they block us, we block them :)
        if (externalUser.username.match(/VEVO$/)) {
            return;
        }

        if ($.inArray(externalUser.username, self.FILTER) !== -1) {
            return;
        }

        var $item = $('<div class="item"/>'),
            $hover = $('<div class="hover"/>'),
            $title = $('<div class="title"/>'),
            image = new Image();
        
        image.onload = function() {
            $item.css({'opacity': '1'});
        };
        image.src = externalUser.avatar_url;

        $item.css({'background-image': 'url('+ externalUser.avatar_url + ')'});
        $hover.click(function() {
            if ($item.hasClass('loading')) {
                return;
            }

            player.pause();

            var user = new ExternalUser({
                type: externalUser.type,
                username: externalUser.username
            });
            user.videoPlayCallback = self.videoPlayCallback;

            $item.addClass('loading');
            LoadingBar.show();
            user.load(function(user) {
                $item.removeClass('loading');
                LoadingBar.hide();
                user.getRightView().find('.video:first-child').dblclick();
            });
        });
        $title.click(function() {
            ExternalUserPage.load(externalUser.type, externalUser.username);
        });

        $title.text(externalUser.username);
        $item.append($title);
        $item.append($hover);

        self.$artists.append($item);
    },

    loadArtists: function(loadMore) {
        var self = HomeScreen,
            i = 0,
            artist = null,
            pageSize = 50;

        if (!loadMore) {
            self.$artists.html('');
            self.page = -1;
            self.hasMore = true;
            history.pushState(null, null, '/');
        }

        self.page += 1;
        
        LoadingBar.show();
        $.getJSON('/api/external_users/top/' + pageSize, {page: self.page}, function(data) {
            var i,
                externalUser;

            LoadingBar.hide();

            if (data.length < pageSize) {
                self.hasMore = false;
            }

            for (i = loadMore ? 1 : 0; i < data.length; i += 1) {
                self.addArtist(data[i]);
            }

            // Load more automatically if we haven't filled the entire screen
            if (data.length > 0 && self.$artists.height() < self.$rightView.height() && self.page < 50) {
                self.loadArtists(true);
            }
        });
    }    
};
