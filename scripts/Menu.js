var pendingVideo;

var Menu = {
    left: [],
    init: function() {
        /* Create new menuitems */
        var leftMenuItems = ['toplist', 'queue', 'search'];
        $.each(leftMenuItems, function(i, type) {
            var menuItem = new MenuItem(type);
            menuItem.init();
            Menu.left.push(menuItem);
        });

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
            $playlists.append(playlist.getMenuView());
        });
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
                self.addTabs(['youtube-top100', 'flattr-toplist']);

                // Init YouTube top 100
                $pane = $('#right .pane.youtube.top100');
                $.each(youtubeTopList, function (i, item) {
                    new Video(item.videoId, item.title, 'youtube', null, self.setAsPlaying).createListView().appendTo($pane);
                });

                // Init Flattr Toplist
                $pane = $('#right .pane.flattr');
                $.each(flattrTopList, function (i, item) {
                    new Video(item.videoId, item.title, 'youtube', null, self.setAsPlaying).createListView().appendTo($pane);
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
                self.addTabs(['youtube-videos', 'youtube-playlists', 'soundcloud-tracks']);
                /* Bind search menu to this */
                Search.menuItem = self;
                break;
            case 'favorites':
                self.leftView = $('#left .menu .favorites');
                self.rightView = $('#right .favorites');
                self.addTabs(['favorites']);
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
        /* Remove selected on all menuItems */
        $('#left .menu li').removeClass('selected');
        self.leftView.addClass('selected');
        
        /* Display right view */
        self.rightView.siblings().hide();
        self.rightView.show();
        
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
