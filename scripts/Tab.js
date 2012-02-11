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
            case 'youtube-top100':
                self.view = $('#right .toplists .tabs .youtube.top100');
                self.paneView = $('#right .toplists .pane.youtube.top100');
                break;
            case 'flattr-toplist':
                self.view = $('#right .toplists .tabs .flattr');
                self.paneView = $('#right .toplists .pane.flattr');
                break;
            case 'youtube-indie':
                self.view = $('#right .toplists .tabs .youtube.indie');
                self.paneView = $('#right .toplists .pane.youtube.indie');
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
            case 'youtube-playlists':
                self.view = $('#right .search .tabs .youtube.playlists');
                self.paneView = $('#right .search .pane.youtube.playlists');
                Search.youtubePlaylistsTab = self;
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
            case 'favorites':
                self.view = $('#right .favorites .tabs .favorites');
                self.paneView = $('#right .favorites .pane.favorites');
                break;
        }
        /* Set click event */
        self.view.click(self.select);
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
        
        /* Search special case */
        if (self.type === 'youtube-videos' || self.type === 'youtube-playlists' || self.type === 'soundcloud-tracks') {
            history.pushState(null, null, '/');
            
            if (!self.view.hasClass('selected')) {
                Search.q = '';
                $('#top .search input').keyup();
            }
        }
        
        /* Remove selected on all menuItems */
        self.view.siblings().removeClass('selected');
        self.view.addClass('selected');
                
        /* Display the right video list */
        self.paneView.siblings('.pane').hide().removeClass('selected');
        self.paneView.show().addClass('selected');
    };
}
