var ExternalUserPage = {
    $view: null,
    $subscribeButton: null,
    $unsubscribeButton: null,
    externalUser: null,

    init: function() {
        var self = this;
        self.$view = $('#right > div.external-profile');
        self.$subscribeButton = self.$view.find('.button.subscribe');
        self.$unsubscribeButton = self.$view.find('.button.unsubscribe');

        self.$subscribeButton.click(function() {
            ExternalUserSubscriptions.subscribe(self.externalUser, function() {
                self.$subscribeButton.hide().next().show();
            });
        });

        self.$unsubscribeButton.click(function() {
            ExternalUserSubscriptions.unsubscribe(self.externalUser, function() {
                self.$unsubscribeButton.hide().prev().show();
            });
        });

        self.$view.find('.recommendations').click(function() {
            Recommendations.findSimilarArtists(self.externalUser);
        });
    },

    setMenuItemAsPlayingFor: function(type, username) {
        var group = Menu.getGroup('external-user-subscriptions');
        $.each(group.menuItems, function(i, menuItem) {
            if (menuItem.$view.hasClass(type) && menuItem.$view.text() === username) {
                menuItem.setAsPlaying();
            }
        });
    },

    showView: function() {
        $('#right > div').hide().removeClass('selected');
        this.$view.show();
    },

    resetView: function() {
        this.$view.find('h1').html('');
        this.$view.find('.source').attr('href', '#').html('');
        this.$view.find('.img').html('');
        this.$view.find('.description').html('');
        this.$view.find('.tracklist').hide();
        this.$view.find('.button.subscribe').hide();
        this.$view.find('.button.unsubscribe').hide();
    },

    show: function(externalUrl) {
        var matches;
        var type;
        var username;

        matches = externalUrl.match('/soundcloud.com/(.*)');
        if (matches) {
            type = 'soundcloud';
            username = matches[1];
        }

        matches = externalUrl.match('youtube.com/user/(.*)');
        if (matches) {
            type = 'youtube';
            username = matches[1];
        }

        this.load(type, username);
    },

    load: function(type, username) {
        switch (type) {
            case 'soundcloud':
            this.loadSoundCloudUser(username);
            break;

            case 'youtube':
            this.loadYouTubeUser(username);
            break;

            default:
            console.log('Unknown type for external users: ' + type);
        }
    },

    loadSoundCloudUser: function(username) {
        var self = this;
        this.resetView();
        this.showView();

        history.pushState(null, null, '/soundcloud/' + username);

        $.getJSON("http://api.soundcloud.com/resolve.json?callback=?", {client_id: SOUNDCLOUD_API_KEY, url: "https://soundcloud.com/" + username}, function(resolveData) {
            $.getJSON("http://api.soundcloud.com/users/" + resolveData.id + ".json", {client_id: SOUNDCLOUD_API_KEY}, function(userData) {
                self.externalUser = new ExternalUserSubscription({
                    type: 'soundcloud',
                    external_user_id: String(userData.id),
                    username: username,
                    display_name: userData.username,
                    avatar_url: userData.avatar_url
                });

                if (UserManager.isLoggedIn()) {
                    if (ExternalUserSubscriptions.isSubscription(self.externalUser)) {
                        self.$unsubscribeButton.show();
                    } else {
                        self.$subscribeButton.show();
                    }
                }

                self.$view.find('h1').text(userData.username);
                self.$view.find('.source').text(TranslationSystem.get('View on SoundCloud')).attr('href', userData.permalink_url);
                self.$view.find('.img').append($('<img src="' + userData.avatar_url + '"/>'));
                self.$view.find('.description').text(Utils.shorten(userData.description, 500));
            });
            
            var key = 'soundcloud' + username;
            var $existingTracklist = self.$view.find('#' + key);
            if ($existingTracklist.length) {
                $existingTracklist.show();
            } else {
                $.getJSON("http://api.soundcloud.com/users/" + resolveData.id + "/tracks.json", {client_id: SOUNDCLOUD_API_KEY}, function(tracksData) {
                    var results = Search.getVideosFromSoundCloudSearchData(tracksData);
                    var $tracklist = $('<table class="tracklist"></table>').attr('id', key);
                    $.each(results, function(i, video) {
                        video.onPlayCallback = function() {
                            self.setMenuItemAsPlayingFor('soundcloud', username);
                        };
                        video.createListView().appendTo($tracklist);
                    });
                    $tracklist.appendTo(self.$view);
                });
            }
        });
    },

    loadYouTubeUser: function(username) {
        var self = this;

        self.resetView();
        self.showView();

        history.pushState(null, null, '/youtube/' + username);

        // https://developers.google.com/youtube/2.0/developers_guide_protocol_profiles#Profiles
        $.getJSON('https://gdata.youtube.com/feeds/api/users/' + username + '?callback=?', {alt: 'json-in-script', v: 2}, function(data) {
            self.externalUser = new ExternalUserSubscription({
                type: 'youtube',
                external_user_id: username,
                username: username,
                display_name: data.entry.author[0].name.$t,
                avatar_url: data.entry.media$thumbnail.url
            });

            if (UserManager.isLoggedIn()) {
                if (ExternalUserSubscriptions.isSubscription(self.externalUser)) {
                    self.$unsubscribeButton.show();
                } else {
                    self.$subscribeButton.show();
                }
            }

            self.$view.find('h1').text(data.entry.author[0].name.$t);
            self.$view.find('.source').text(TranslationSystem.get('View on YouTube')).attr('href', 'http://www.youtube.com/user/' + username);
            self.$view.find('.img').append($('<img src="' + self.externalUser.avatarUrl + '"/>'));
            self.$view.find('.description').text(data.entry.summary.$t);
        });

        var key = 'youtube' + username;
        var $existingTracklist = self.$view.find('#' + key);
        if ($existingTracklist.length) {
            $existingTracklist.show();
        } else {
            // https://developers.google.com/youtube/2.0/developers_guide_protocol_video_feeds#User_Uploaded_Videos
            $.getJSON('https://gdata.youtube.com/feeds/api/users/' + username + '/uploads?callback=?', {alt: 'json-in-script', v: 2}, function(data) {
                if (data.feed.entry === undefined) {
                    return;
                }
                var results = Search.getVideosFromYouTubeSearchData(data);
                var $tracklist = $('<table class="tracklist"></table>').attr('id', key);
                $.each(results, function(i, video) {
                    video.onPlayCallback = function() {
                        self.setMenuItemAsPlayingFor('youtube', username);
                    };
                    video.createListView().appendTo($tracklist);
                });
                $tracklist.appendTo(self.$view);
            });
        }
    }
};

function ExternalUserSubscription(data) {
    var self = this;
    self.externalUserId = data.external_user_id;
    self.type = data.type;
    self.username = data.username;
    self.displayName = data.display_name;
    self.avatarUrl = data.avatar_url;
    self.menuItem = null;

    self.getMetaData = function() {
        return {
            username: self.username,
            avatar_url: self.avatarUrl
        };
    };

    self.goTo = function() {
        console.log(self, 'goto');
        ExternalUserPage.load(self.type, self.username);
    };

    self.getUrl = function() {
        return '/' + self.type + '/' + self.externalUserId;
    };

    self.getApiUrl = function() {
        return '/api/external_users/' + self.type + '/' + self.externalUserId + '/subscribers';
    };

    self.equals = function(other) {
        return self.externalUserId === other.externalUserId && self.type === other.type;
    };

    self.getMenuItem = function() {
        if (self.menuItem === null) {
            self.menuItem = new MenuItem({
                cssClasses: ['external-user-subscription', self.type],
                title: self.username,
                $img: $('<img/>').attr('src', self.avatarUrl),
                onSelected: function() {
                    ExternalUserPage.load(self.type, self.username);
                }
            });
        }
        return self.menuItem;
    };
}

var ExternalUserSubscriptions = {
    subscriptions: [],

    init: function() {
        var self = this;
        if (UserManager.isLoggedIn()) {
            $.getJSON('/me/external_user_subscriptions', function(data) {
                $.each(data, function(i, subscription) {
                    self.subscriptions.push(new ExternalUserSubscription(subscription));
                });
                self.updateMenu();
            });
        }
    },

    updateMenu: function() {
        var self = this;
        var group = Menu.getGroup('external-user-subscriptions');
        group.clear();
        $.each(self.subscriptions, function(i, subscription) {
            group.addMenuItem(subscription.getMenuItem());
        });
    },

    isSubscription: function(externalUser) {
        var ret = false;
        $.each(this.subscriptions, function(i, subscription) {
            if (externalUser.equals(subscription)) {
                ret = true;
                return;
            }
        });
        return ret;
    },

    subscribe: function(externalUser, callback) {
        var self = this;
        LoadingBar.show();

        $.ajax({
            type: 'POST',
            url: externalUser.getApiUrl(),
            data: externalUser.getMetaData(),
            complete: function(jqXHR, textStatus) {
                LoadingBar.hide();
            },
            statusCode: {
                200: function(data) {
                    self.subscriptions.push(externalUser);
                    self.updateMenu();
                    callback();
                },
                409: function(data) {
                    new ReloadDialog().show();
                }
            }
        });
    },

    unsubscribe: function(externalUser, callback) {
        var self = this;
        LoadingBar.show();

        $.ajax({
            type: 'DELETE',
            url: externalUser.getApiUrl(),
            complete: function(jqXHR, textStatus) {
                LoadingBar.hide();
            },
            statusCode: {
                200: function(data) {
                    var newSubscriptions = [];
                    $.each(self.subscriptions, function(i, subscription) {
                        if (!externalUser.equals(subscription)) {
                            newSubscriptions.push(subscription);
                        }
                    });
                    self.subscriptions = newSubscriptions;
                    self.updateMenu();
                    callback();
                },
                409: function(data) {
                    new ReloadDialog().show();
                }
            }
        });
    }
};
