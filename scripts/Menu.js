var pendingVideo;

var Menu = {
    left: [],
    init: function() {
        /* Create new menuitems */
        var leftMenuItems = ['toplist', 'queue', 'search'];
        $.each(leftMenuItems, function(i, name) {
            var menuItem = new MenuItem(name);
            menuItem.init();
            Menu.left.push(menuItem);
        });
        
        /* Bind events */
        $('#left .playlists .new span').click(Menu.newPlaylistClick);
        $('#left .playlists .new input').keyup(Menu.newPlaylistNameKeyUp);
        $('#left .playlists .new input').blur(Menu.newPlaylistNameBlur);
    },
    createPlaylistViews: function() {
        $('#left .menu .playlists').html('');
        for (var i = 0; i < playlistManager.playlists.length; i += 1) {
            playlistManager.getPlaylist(i).createViews();
        }
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
                    if (logged_in) {
                        playlist.createNewPlaylistOnRemote(function() {
                            playlistManager.save();
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
    var self = this;
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
                self.addTabs(['youtify', 'youtube-top100', 'youtube-indie']);
                break;
            case 'queue':
                self.leftView = $('#left .menu .queue');
                self.rightView = $('#right > .queue');
                self.addTabs(['queue']);
                break;
            case 'search':
                self.leftView = $('#left .menu .search');
                self.rightView = $('#right .search');
                self.addTabs(['youtube-videos', 'youtube-playlists']);
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
                    selectedTab = item;
                    return false;
                }
            });
            /* No selected tab was found. Select the first. */
            if (selectedTab === null) {
                self.tabs[0].select();
            }
        }
    };
    
    self.addTabs = function(tabList) {
        $.each(tabList, function(i, type) {
            var tab = new Tab(type, self);
            tab.init();
            self.tabs.push(tab);
        });
    };
}
