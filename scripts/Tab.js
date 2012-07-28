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
            case 'playlists-toplist':
                self.view = $('#right .toplists .tabs .playlists');
                self.paneView = $('#right .toplists .pane.playlists');
                break;
            case 'queue':
                self.view = $('#right .queue .info .queue');
                self.paneView = $('#right .queue .pane.queue');
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
        
        /* Remove selected on all menuItems */
        self.view.siblings().removeClass('selected');
        self.view.addClass('selected');
                
        /* Display the right video list */
        self.paneView.siblings('.pane').hide().removeClass('selected');
        self.paneView.show().addClass('selected');
    };
}
