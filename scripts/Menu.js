var pendingVideo;

var Menu = {
    left: [],
    profile: null,
    init: function() {
        /* Create new menuitems */
        var leftMenuItems = [];
        if (logged_in) {
            leftMenuItems.push('news-feed');
        }
        leftMenuItems.push('toplist');
        leftMenuItems.push('queue');
        leftMenuItems.push('search');
        $.each(leftMenuItems, function(i, type) {
            var menuItem = new MenuItem(type);
            menuItem.init();
            Menu.left.push(menuItem);
        });
        
        /* Add profile */
        Menu.profile = new MenuItem('profile');
        Menu.profile.init();

        EventSystem.addEventListener('playlists_loaded', this.createPlaylistViews);

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
    self.tabs = [];
    
    self.init = function() {
        /* Bind views */
        switch(self.type) {
            case 'toplist':
                self.leftView = $('#left .menu .toplist');
                self.rightView = $('#right .toplists');
                self.addTabs(['flattr-toplist', 'youtube-top100']);

                // Init YouTube top 100
                $pane = $('#right .pane.youtube.top100');
                $.each(youtubeTopList, function (i, item) {
                    new Video({
                        videoId: item.videoId,
                        title: item.title,
                        type: 'youtube',
                        onPlayCallback: self.setAsPlaying
                    }).createListView().appendTo($pane);
                });

                // Init Flattr Toplist
                $pane = $('#right .pane.flattr');
                $.each(flattrTopList, function (i, item) {
                    new Video({
                        videoId: item.videoId,
                        title: item.title,
                        type: item.type,
                        flattrThingId: item.flattrThingId,
                        flattrs: item.flattrs,
                        onPlayCallback: self.setAsPlaying,
                        duration: item.duration
                    }).createListView().appendTo($pane);
                });

                break;
            case 'queue':
                self.leftView = $('#left .menu .queue');
                self.rightView = $('#right > .queue');
                self.addTabs(['queue']);
                break;
            case 'search':
                self.leftView = $('#left .menu .search');
                self.rightView = $('#right .search');
                self.addTabs(['youtube-videos', 'soundcloud-tracks', 'officialfm-tracks']);
                /* Bind search menu to this */
                Search.menuItem = self;
                break;
            case 'favorites':
                self.leftView = $('#left .menu .favorites');
                self.rightView = $('#right .favorites');
                self.addTabs(['favorites']);
                break;
            case 'profile':
                self.leftView = $('#top .profile');
                self.rightView = $('#right .profile');
                self.addTabs(['profile-playlists', 'profile-followings', 'profile-followers']);
                break;
            case 'news-feed':
                self.leftView = $('#left .menu .news-feed');
                self.rightView = $('#right .news-feed');
                break;

        }
        /* Set click event */
        self.leftView.click(self.select);
        self.leftView.data('model', self);
        self.rightView.data('model', self);

        $('#left .toplist').click();
    };
    self.findTab = function(type) {
        var i;
        for(i = 0; i < self.tabs.length; i += 1) {
            if (self.tabs[i].type === type) {
                return self.tabs[i];
            }
        }
        return null;
    };
    self.select = function() {
        /* DeSelect left menus and hide right views */
        Menu.deSelectAll();
        
        /* Populate fields with current user */
        if (self.type === 'profile') {
            history.pushState(null, null, '/profile');
            UserManager.populateUserProfile(UserManager.currentUser);
        } else if (self.type === 'news-feed') {
            self.rightView.html('');

            function getActivityElem(activity) {
                var $div = $('<div class="activity"></div>');

                function getUserActivityElem(user) {
                    var $user = $('<span class="user"></span>');

                    $('<img />').attr('src', user.smallImageUrl).appendTo($user);
                    $('<span class="name"></span>').text(user.displayname).appendTo($user);

                    $user.click(function() {
                        history.pushState(null, null, '/users/' + user.id);
                        Menu.deSelectAll();
                        UserManager.loadProfile(user.id);
                    });

                    return $user;
                }

                function getPlaylistActivityElem(playlist) {
                    var $playlist = $('<span class="playlist"></span>');

                    $playlist.text(playlist.title);

                    $playlist.click(function() {
                        history.pushState(null, null, '/playlists/' + playlist.remoteId);
                        Menu.deSelectAll();
                        loadPlaylist(playlist.remoteId);
                    });

                    return $playlist;
                }

                switch (activity.verb) {
                    case 'follow':
                    var user = new User(JSON.parse(activity.user));
                    var otherUser = new User(JSON.parse(activity.data));
                    if (otherUser.id === UserManager.currentUser.id) {
                        $div.append(getUserActivityElem(user));
                        $div.append('<span> started following you</span>');
                    } else if (user.id === UserManager.currentUser.id) {
                        $div.append('<span>You started following </span>');
                        $div.append(getUserActivityElem(otherUser));
                    }
                    break;

                    case 'subscribe':
                    var user = new User(JSON.parse(activity.user));
                    var playlist = JSON.parse(activity.data);
                    var playlistOwner = new User(playlist.owner);
                    if (playlistOwner.id === UserManager.currentUser.id) {
                        $div.append(getUserActivityElem(user));
                        $div.append('<span> subscribed to your playlist </span>');
                        $div.append(getPlaylistActivityElem(playlist));
                    } else if (user.id === UserManager.currentUser.id) {
                        $div.append('<span>You subscribed to </span>');
                        $div.append(getPlaylistActivityElem(playlist));
                        $div.append('<span> by </span>');
                        $div.append(getUserActivityElem(playlistOwner));
                    }
                    break;
                }

                return $div;
            };

            LoadingBar.show();
            $.get('/me/activities', function(data) {
                LoadingBar.hide();
                $.each(data, function(i, activity) {
                    self.rightView.append(getActivityElem(activity));
                });
            });
        }
        
        /* Display views */
        self.rightView.show();
        self.leftView.addClass('selected');
        
        /* Display the right video list */
        if (self.tabs.length > 0) {
            var selectedTab = null;
            $.each(self.tabs, function(i, tab) {
                if (tab.isSelected()) {
                    selectedTab = tab;
                    return false;
                }
            });
            /* No selected tab was found. Select the first. */
            if (selectedTab === null) {
                self.tabs[0].select();
            }
        }
    };
    self.setAsPlaying = function() {
        /* Remove playing on all menuItems */
        $('#left .menu li').removeClass('playing');
        self.leftView.addClass('playing');
    };
    
    self.addTabs = function(tabList) {
        $.each(tabList, function(i, type) {
            var tab = new Tab(type, self);
            tab.init();
            self.tabs.push(tab);
        });
    };
}
