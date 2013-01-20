
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
    
    resetFilter: function() {
        var self = Filter;
        self.$leftFilterInput.val('');
        self.$rightFilterInput.val('');
        self.leftKeyUp();
        self.rightKeyUp();
    },
    
    showLeft: function() {
        var self = Filter;
        self.$menuitems = $('#left .menu li').not('.group').not('.loading-animation');
        self.$leftFilter.slideDown(200);
        self.$leftFilterInput.focus();
    },
    hideLeft: function() {
        var self = Filter;
        self.resetFilter();
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
        self.resetFilter();
        self.$rightFilterInput.blur();
        self.$rightFilter.slideUp(200);
    },
    
    leftKeyUp: function(event) {
        var self = Filter,
            filterString = self.$leftFilterInput.val().trim().toLowerCase();
        if (event && event.keyCode === 27) {
            self.hideLeft();
            return;
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
            }
        });
    },
    rightKeyUp: function(event) {
        var self = Filter,
            filterString = self.$rightFilterInput.val().trim().toLowerCase();
        if (event && event.keyCode === 27) {
            self.hideRight();
            return;
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