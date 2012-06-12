function Tab(type, parent) {
    var self = this;
    self.type = type;
    self.parent = parent;
    self.view = null;
    self.paneView = null;
    
    self.init = function() {
        /* Bind views */
        switch(self.type) {
            case 'youtify':
                self.view = $('#right .toplists .tabs .youtify');
                self.paneView = $('#right .toplists .pane.youtify');
                break;
            case 'flattr-toplist':
                self.view = $('#right .toplists .tabs .flattr');
                self.paneView = $('#right .toplists .pane.flattr');
                break;
            case 'queue':
                self.view = $('#right .queue .info .queue');
                self.paneView = $('#right .queue .pane.queue');
                break;
            case 'youtube-videos':
                self.view = $('#right .search .tabs .youtube.videos');
                self.paneView = $('#right .search .pane.youtube.videos');
                Search.youtubeVideosTab = self;
                break;
            case 'soundcloud-tracks':
                self.view = $('#right .search .tabs .soundcloud.tracks');
                self.paneView = $('#right .search .pane.soundcloud.tracks');
                Search.soundCloudTracksTab = self;
                break;
            case 'officialfm-tracks':
                self.view = $('#right .search .tabs .officialfm.tracks');
                self.paneView = $('#right .search .pane.officialfm.tracks');
                Search.officialfmTracksTab = self;
                break;
            case 'youtify-users':
                self.view = $('#right .search .tabs .youtify.users');
                self.paneView = $('#right .search .pane.youtify.users');
                Search.youtifyUsersTab = self;
                break;
            case 'youtify-playlists':
                self.view = $('#right .search .tabs .youtify.playlists');
                self.paneView = $('#right .search .pane.youtify.playlists');
                Search.youtifyPlaylistsTab = self;
                break;
            case 'favorites':
                self.view = $('#right .favorites .tabs .favorites');
                self.paneView = $('#right .favorites .pane.favorites');
                break;
            case 'profile-playlists':
                self.view = $('#right .profile .tabs .profile-playlists');
                self.paneView = $('#right .profile .pane.profile-playlists');
                break;
            case 'profile-followings':
                self.view = $('#right .profile .tabs .profile-followings');
                self.paneView = $('#right .profile .pane.profile-followings');
                break;
            case 'profile-followers':
                self.view = $('#right .profile .tabs .profile-followers');
                self.paneView = $('#right .profile .pane.profile-followers');
                break;
            case 'profile-flattrs':
                self.view = $('#right .profile .tabs .profile-flattrs');
                self.paneView = $('#right .profile .pane.profile-flattrs');
                break;
        }
        /* Set click event */
        self.view.mousedown(self.select);
        self.view.data('model', self);
    };
    
    self.isSelected = function() {
        return self.view.hasClass('selected');
    };
    
    self.select = function() {
        /* Select parent? */
        if (!self.parent.leftView.hasClass('selected')) {
            self.parent.select();
        }
        
        if (self.type === 'youtube-videos' || self.type === 'soundcloud-tracks' ||
            self.type === 'officialfm-tracks' || self.type === 'youtify-users' || 
            self.type === 'youtify-playlists') {
            history.pushState(null, null, '/');
            
            if (!self.view.hasClass('selected')) {
                Search.q = '';
                $('#top .search input').keyup();
            }
        } else if (self.type === 'profile-followers') {
            UserManager.loadFollowers();
        } else  if (self.type === 'profile-followings') {
            UserManager.loadFollowings();
        } else  if (self.type === 'profile-flattrs') {
            UserManager.loadFlattrs();
        }
        
        /* Remove selected on all menuItems */
        self.view.siblings().removeClass('selected');
        self.view.addClass('selected');
                
        /* Display the right video list */
        self.paneView.siblings('.pane').hide().removeClass('selected');
        self.paneView.show().addClass('selected');
    };
}
