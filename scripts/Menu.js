var pendingVideo;

var Menu = {
    left: [],
    init: function() {
        /* Create new menuitems */
        var leftMenuItems = [];
        if (logged_in) {
            leftMenuItems.push('news-feed');
        }
        leftMenuItems.push('home');
        leftMenuItems.push('queue');
        $.each(leftMenuItems, function(i, type) {
            var menuItem = new MenuItem(type);
            menuItem.init();
            Menu.left.push(menuItem);
        });
        
        EventSystem.addEventListener('playlists_loaded', this.createPlaylistViews);
        EventSystem.addEventListener('external_user_subscriptions_updated', this.updateExternalUserSubscriptions);

        /* Bind events */
        $('#left .playlists .new span').click(Menu.newPlaylistClick);
        $('#left .playlists .new input').keyup(Menu.newPlaylistNameKeyUp);
        $('#left .playlists .new input').blur(Menu.newPlaylistNameBlur);
    },
    find: function(type) {
        var i;
        for(i = 0; i < Menu.left.length; i += 1) {
            if (Menu.left[i].type === type) {
                return Menu.left[i];
            }
        }
        return null;
    },
    createPlaylistViews: function(playlists) {
        $playlists = $('#left .menu .playlists ul');
        $playlists.html('');

        $.each(playlists, function(i, playlist) {
            Menu.addPlaylist(playlist);
        });
    },
    updateExternalUserSubscriptions: function(subscriptions) {
        var $subscriptions = $('#left .menu .external-user-subscriptions ul');
        $subscriptions.html('');

        $.each(subscriptions, function(i, subscription) {
            $subscriptions.append(subscription.getMenuView());
        });
    },
    addPlaylist: function(playlist) {
        $playlists = $('#left .menu .playlists ul');
        $playlists.append(playlist.getMenuView());
        
    },
    newPlaylistClick: function() {
        var suggestedTitle = '',
            artist;
            
        /* Generate playlist name from dragged video */
        if (pendingVideo) {
            artist = extractArtist(pendingVideo.title);
            if (artist) {
                suggestedTitle = artist;
            }
        }
        
        /* Hide the label and show the text input */
        $(this).hide();
        $('#left .playlists .new input')
            .show()
            .focus()
            .select()
            .val(suggestedTitle);
    },
    newPlaylistNameBlur: function() {
        $('#left .playlists .new span').show();
        $(this).hide();
        pendingVideo = null;
    },
    newPlaylistNameKeyUp: function(event) {
        var title,
            playlist,
            videos = [];

        switch (event.keyCode) {
            case 13: // RETURN
                $('#left .playlists .new input').hide();
                $('#left .playlists .new span').show();

                title = $.trim($(this).val());
                if (title.length > 0 && title.length < 50) {
                    if (pendingVideo) {
                        videos.push(pendingVideo);
                    }
                    playlist = new Playlist($(this).val(), videos);
                    playlist.createViews();
                    playlistManager.addPlaylist(playlist);
                    playlist.getMenuView().appendTo('#left .playlists ul');
                    if (logged_in) {
                        playlist.createNewPlaylistOnRemote(function() {
                            playlistManager.save();
                            playlist.getMenuView().addClass('remote');
                        });
                    } else {
                        playlistManager.save();
                    }
                } else {
                    return;
                }
                $(this).val('');
                pendingVideo = null;
                break;
            case 27: // ESC
                $('#left .playlists .new input').hide();
                $('#left .playlists .new span').show();
                $(this).val('');
                pendingVideo = null;
                break;
        }
        event.stopPropagation();
    },
    deSelectAll: function() {
        /* Remove selected on all menuItems */
        $('#left .menu li').removeClass('selected');
        
        /* Hide right view */
        $('#right > div').hide();
    }
};

function MenuItem(type) {
    var self = this,
        $pane;
    self.type = type;
    self.leftView = null;
    self.rightView = null;
    
    self.init = function() {
        /* Bind views */
        switch(self.type) {
            case 'home':
                self.leftView = $('#left .menu .home');
                self.rightView = $('#right .home');
                break;
            case 'queue':
                self.leftView = $('#left .menu .queue');
                self.rightView = $('#right > .queue');
                break;
            case 'news-feed':
                self.leftView = $('#left .menu .news-feed');
                self.rightView = $('#right .news-feed');
                break;

        }
        /* Set click event */
        self.leftView.mousedown(self.select);
        self.leftView.data('model', self);
        self.rightView.data('model', self);
    };
    self.select = function() {
        $('#right, #top .search').removeClass('focused');
        $('#left').addClass('focused');

        /* DeSelect left menus and hide right views */
        Menu.deSelectAll();
        
        if (self.type === 'home') {
            HomeScreen.show();
        } else if (self.type === 'news-feed') {
            self.rightView.html('');
            LoadingBar.show();
            NewsFeed.load(function($newsFeed) {
                self.rightView.append($newsFeed);
                LoadingBar.hide();
            });
        }
        
        /* Display views */
        self.rightView.show();
        self.leftView.addClass('selected');
    };
    self.setAsPlaying = function() {
        /* Remove playing on all menuItems */
        $('#left .menu li').removeClass('playing');
        self.leftView.addClass('playing');
    };
}
