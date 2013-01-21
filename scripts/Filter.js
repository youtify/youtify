
Filter = {
    $leftFilter: null,
    $leftFilterInput: null,
    $rightFilter: null,
    $rightFilterInput: null,
    $menuitems: null,
    $tracklist: null,
    
    init: function() {
        var self = Filter,
            externalUsersLoaded = false,
            playlistsLoaded = true;
        
        self.$leftFilter = $('.left-wrapper .filter');
        self.$leftFilterInput = $('.left-wrapper .filter input[type=search]');
        self.$leftFilterInput.keyup(self.leftKeyUp);
        self.$leftFilter.find('button').click(self.hideLeft);
        
        self.$rightFilter = $('.right-wrapper .filter');
        self.$rightFilterInput = $('.right-wrapper .filter input[type=search]');
        self.$rightFilterInput.keyup(self.rightKeyUp);
        self.$rightFilter.find('button').click(self.hideRight);
    },
    
    resetFilter: function(left, right) {
        var self = Filter;
        if (typeof(left) === 'undefined' || left === true) {
            self.$leftFilterInput.val('');
            self.leftKeyUp();
        }
        if (typeof(right) === 'undefined' || right === true) {
            self.$rightFilterInput.val('');
            self.rightKeyUp();
        }
    },
    
    showLeft: function() {
        var self = Filter;
        self.$menuitems = $('#left .menu li').not('.group').not('.loading-animation');
        self.$leftFilter.slideDown(200);
        self.$leftFilterInput.focus();
    },
    hideLeft: function() {
        var self = Filter;
        self.resetFilter(true, false);
        self.$leftFilterInput.blur();
        self.$leftFilter.slideUp(200);
    },
    showRight: function() {
        var self = Filter;
        self.$tracklist = $('#right > div:visible .tracklist:visible .video');
        self.$rightFilter.slideDown(200);
        self.$rightFilterInput.focus();
    },
    hideRight: function() {
        var self = Filter;
        self.resetFilter(false, true);
        self.$rightFilterInput.blur();
        self.$rightFilter.slideUp(200);
    },
    
    leftKeyUp: function(event) {
        var self = Filter,
            filterString = self.$leftFilterInput.val().trim().toLowerCase(),
            selected = false;
        if (event) {
            switch(event.keyCode) {
                case 27: // ESC
                    self.hideLeft();
                    return;
                case 9: // TAB
                case 13: // Enter
                case 37: // Left
                case 38: // Up
                case 39: // Right
                case 40: // Down
                    return;
            }
        }
        
        if (self.$menuitems === null || self.$menuitems === 0) {
            return;
        }
        if (filterString.length === 0) {
            self.$menuitems.show();
            return;
        }

        self.$menuitems.each(function(index, item) {
            var title = $(item).find('.title').text().toLowerCase();

            if (title.indexOf(filterString) === -1) {
                $(item).hide();
            } else {
                $(item).show();
                if (selected === false) {
                    self.resetFilter(false, true);
                    $(item).trigger('mousedown');
                    selected = true;
                }
            }
        });
    },
    rightKeyUp: function(event) {
        var self = Filter,
            filterString = self.$rightFilterInput.val().trim().toLowerCase();
        if (event) {
            switch(event.keyCode) {
                case 27: // ESC
                    self.hideRight();
                    return;
                case 9: // TAB
                case 13: // Enter
                case 37: // Left
                case 38: // Up
                case 39: // Right
                case 40: // Down
                    return;
            }
        }

        if (self.$tracklist === null || self.$tracklist === 0) {
            return;
        }
        if (filterString.length === 0) {
            self.$tracklist.show();
            return;
        }
        self.$tracklist.each(function(index, item) {
            var title = $(item).find('.title').text().toLowerCase(),
                uploader = $(item).find('.uploader').text().toLowerCase();
            
            if (title.indexOf(filterString) === -1 && uploader.indexOf(filterString) === -1) {
                $(item).hide();
            } else {
                $(item).show();
            }
        });
    }
};