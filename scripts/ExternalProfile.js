var ExternalProfile = {
    $view: null,

    init: function() {
        this.$view = $('#right > div.external-profile');
    },

    showView: function() {
        Menu.deSelectAll();
        this.$view.show();
    },

    resetView: function() {
        this.$view.find('h1').html('');
        this.$view.find('.source').attr('href', '#').html('');
        this.$view.find('.img').html('');
        this.$view.find('.description').html('');
        this.$view.find('.tracklist').html('');
    },

    show: function(externalUrl) {
        var matches;

        matches = externalUrl.match('/soundcloud.com/(.*)');
        if (matches.length) {
            this.loadSoundCloudUser(matches[1]);
        }
    },

    loadSoundCloudUser: function(username) {
        self = this;
        self.resetView();
        history.pushState(null, null, '/soundcloud/' + username);

        $.get("http://api.soundcloud.com/resolve.json", {client_id: SOUNDCLOUD_API_KEY, url: "https://soundcloud.com/" + username}, function(resolveData) {
            if (typeof(resolveData) === "string") {
                resolveData = JSON.parse(resolveData);
            }
            
            $.get("http://api.soundcloud.com/users/" + resolveData.id + ".json", {client_id: SOUNDCLOUD_API_KEY}, function(userData) {
                if (typeof(userData) === "string") {
                    userData = JSON.parse(userData);
                }
                self.$view.find('h1').text(userData.full_name);
                self.$view.find('.source').text(TranslationSystem.get('View on SoundCloud')).attr('href', userData.permalink_url);
                self.$view.find('.img').append($('<img src="' + userData.avatar_url + '"/>'));
                self.$view.find('.description').text(userData.description);
            });
            
            $.get("http://api.soundcloud.com/users/" + resolveData.id + "/tracks.json", {client_id: SOUNDCLOUD_API_KEY}, function(tracksData) {
                if (typeof(tracksData) === "string") {
                    tracksData = JSON.parse(tracksData);
                }
                var results = Search.getVideosFromSoundCloudSearchData(tracksData);
                var $tracklist = self.$view.find('.tracklist');
                $.each(results, function(i, video) {
                    video.createListView().appendTo($tracklist);
                });
            });
            self.showView();
        });
    }
};
