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
                break;
            case 'youtube-playlists':
                self.view = $('#right .search .tabs .youtube.playlists');
                self.paneView = $('#right .search .pane.youtube.playlists');
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
    
    self.select = function() {
        /* Select parent? */
        if (!self.parent.leftView.hasClass('selected')) {
            self.parent.select();
        }
        
        /* Search special case */
        if (self.type === 'youtube-videos' || self.type === 'youtube-playlists') {
            history.pushState(null, null, '/');
            
            if (!self.view.hasClass('selected')) {
                Search.q = '';
                $('#top .search input').keyup();
            }
        }
        
        /* Remove selected on all menus */
        self.view.siblings().removeClass('selected');
        self.view.addClass('selected');
                
        /* Display the right video list */
        self.paneView.siblings('.pane').hide().removeClass('selected');
        self.paneView.show().addClass('selected');
    };
}