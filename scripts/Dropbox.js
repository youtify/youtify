Dropbox = {
    $rightView: null,
    $tracklist: null,
    menuItem: null,
    tracks: [],

    init: function() {
        var self = Dropbox;
        self.$rightView = $('#right > .dropbox');
        self.$tracklist = $('#right > .dropbox .tracklist');
        if (UserManager.currentUser && UserManager.currentUser.dropboxUserName) {
            self.menuItem = new MenuItem({
                cssClasses: ['dropbox'],
                title: TranslationSystem.get('Dropbox'),
                $contentPane: self.$rightView,
                onSelected: function() {
                    if (self.isEmpty()) {
                        self.loadTracks();
                    }
                    history.pushState(null, null, '/dropbox');
                    if (self.isEmpty()) {
                        self.$rightView.find('.help-box').show();
                    } else {
                        self.$rightView.find('.help-box').hide();
                    }
                },
                translatable: true
            });
            Menu.getGroup('misc').addMenuItem(self.menuItem);
        }
    },
    isEmpty: function() {
        var self = this;
        return self.tracks === null || self.tracks.length === 0;
    },
    getMenuItem: function() {
        return this.menuItem;
    },
    loadTracks: function() {
        var self = Dropbox;
        LoadingBar.show();
        $.get('/api/dropbox/list', function(data) {
            $.each(data, function(i, item) {
                var video = new Video({
                    videoId: item.videoId,
                    title: item.title,
                    type: item.type,
                    onPlayCallback: self.menuItem.setAsPlaying
                });
                video.createListView().appendTo(self.$tracklist);
                self.tracks.push(video);
            });
            if (self.isEmpty()) {
                self.$rightView.find('.help-box').show();
            } else {
                self.$rightView.find('.help-box').hide();
            }
            LoadingBar.hide();
        });
    }
};