var ExternalUserPage = {
    $view: null,
    selectedUser: null,
    cache: {},

    init: function() {
        this.$view = $('#right > div.external-profile');
    },

    show: function() {
        $('#right > div').hide();
        this.$view.show();
    },

    loadFromExternalUrl: function(externalUrl) {
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
        var self = this;

        var user;
        var key = type + username;
        if (self.cache.hasOwnProperty(key)) {
            user = self.cache[key];
        } else {
            user = new ExternalUser({
                type: type,
                username: username
            });
            self.cache[key] = user;
            self.$view.append(user.getRightView());

            LoadingBar.show();
            user.load(function(user) {
                LoadingBar.hide();
            });
        }

        history.pushState(null, null, user.getUrl());

        if (self.selectedUser) {
            self.selectedUser.getRightView().hide();
        }
        self.selectedUser = user;
        self.selectedUser.getRightView().show();
        self.show();
    }
};

function ExternalUser(data) {
    var self = this;
    self.externalUserId = data.external_user_id;
    self.type = data.type;
    self.username = data.username;
    self.avatarUrl = data.avatar_url;
    self.menuItem = null;

    self.displayName = data.display_name;
    self.linkLabel = data.linkLabel;
    self.linkUrl = data.linkUrl;
    self.description = data.description;

    self.$rightView = $('<div class="external-user">').addClass(data.type);
    self.$tracklist = $('<table class="tracklist">');
    self.$info = $('<div class="info">');

    self.$rightView.append(self.$info);
    self.$rightView.append(self.$tracklist);

    self.getRightView = function() {
        return self.$rightView;
    };

    EventSystem.addEventListener('external_user_subscriptions_loaded', function() {
        self.updateInfoBar();
    });

    self.updateInfoBar = function() {
        self.$info.html('');

        var $img = $('<img/>').attr('src', self.avatarUrl);

        var $nameContainer = $('<div class="name-container">');
        var $h1 = $('<h1>').text(self.displayName);
        var $subscribeButton = $('<button class="button subscribe translatable">').text(TranslationSystem.get('Subscribe'));
        var $unsubscribeButton = $('<button class="button unsubscribe translatable">').text(TranslationSystem.get('Unsubscribe'));

        $nameContainer.append($h1);
        $nameContainer.append($subscribeButton);
        $nameContainer.append($unsubscribeButton);

        var $source = $('<a class="source link" target="_blank">').attr('href', self.linkUrl).text(self.linkLabel || '');
        var $recommendations = $('<span class="recommendations link translatable" target="_blank">').text(TranslationSystem.get('Similar artists'));
        var $description = $('<div class="description">').text(Utils.shorten(self.description || '', 500));

        $subscribeButton.click(function() {
            ExternalUserManager.subscribe(self, function() {
                $subscribeButton.hide().next().show();
            });
        });

        $unsubscribeButton.click(function() {
            ExternalUserManager.unsubscribe(self, function() {
                $unsubscribeButton.hide().prev().show();
            });
        });

        if (ExternalUserManager.isSubscription(self)) {
            $subscribeButton.hide();
        } else {
            $unsubscribeButton.hide();
        }

        $recommendations.click(function() {
            Recommendations.findSimilarArtists(self);
        });

        self.$info.append($img);
        self.$info.append($nameContainer);
        self.$info.append($source);
        self.$info.append($('<span> | </span>'));
        self.$info.append($recommendations);
        self.$info.append($description);
    };

    self.getMetaData = function() {
        return {
            username: self.username,
            avatar_url: self.avatarUrl
        };
    };

    self.getCacheKey = function() {
        return self.type + self.username;
    };

    self.goTo = function() {
        ExternalUserPage.load(self.type, self.username);
    };

    self.getUrl = function() {
        return '/' + self.type + '/' + self.username;
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

    self.load = function(callback) {
        switch (self.type) {
            case 'soundcloud':
            self.loadSoundCloudUser(callback);
            break;

            case 'youtube':
            self.loadYouTubeUser(callback);
            break;

            default:
            console.log('Unknown type for external users: ' + type);
        }
    };

    self.videoPlayCallback = function() {
        if (Menu.getPlayingMenuItem() !== self.getMenuItem()) {
            Menu.setAsNotPlaying();
        }
        ExternalUserManager.setMenuItemAsPlayingFor(self);
    };

    self.loadSoundCloudUser = function(callback) {
        $.getJSON("http://api.soundcloud.com/resolve.json?callback=?", {client_id: SOUNDCLOUD_API_KEY, url: "https://soundcloud.com/" + self.username}, function(resolveData) {
            $.getJSON("http://api.soundcloud.com/users/" + resolveData.id + ".json", {client_id: SOUNDCLOUD_API_KEY}, function(userData) {
                self.externalUserId = String(userData.id);
                self.displayName = userData.username;
                self.avatarUrl = userData.avatar_url;
                self.linkLabel = TranslationSystem.get('View on SoundCloud');
                self.linkUrl = userData.permalink_url;
                self.description = userData.description;
                self.updateInfoBar();

                $.getJSON("http://api.soundcloud.com/users/" + resolveData.id + "/tracks.json", {client_id: SOUNDCLOUD_API_KEY}, function(tracksData) {
                    var results = Search.getVideosFromSoundCloudSearchData(tracksData);
                    $.each(results, function(i, video) {
                        video.parent = self;
                        video.onPlayCallback = self.videoPlayCallback;
                        video.createListView().appendTo(self.$tracklist);
                    });
                    callback(self);
                });
            });
        });
    };

    self.loadYouTubeUser = function(callback) {
        // https://developers.google.com/youtube/2.0/developers_guide_protocol_profiles#Profiles
        $.getJSON('https://gdata.youtube.com/feeds/api/users/' + self.username + '?callback=?', {alt: 'json-in-script', v: 2}, function(data) {
            self.externalUserId = self.username;
            self.displayName = data.entry.author[0].name.$t;
            self.avatarUrl = data.entry.media$thumbnail.url;
            self.linkLabel = TranslationSystem.get('View on YouTube');
            self.linkUrl = 'http://www.youtube.com/user/' + self.username;
            self.description = data.entry.summary.$t;
            self.updateInfoBar();

            // https://developers.google.com/youtube/2.0/developers_guide_protocol_video_feeds#User_Uploaded_Videos
            $.getJSON('https://gdata.youtube.com/feeds/api/users/' + self.username + '/uploads?callback=?', {alt: 'json-in-script', v: 2}, function(data) {
                if (data.feed.entry !== undefined) {
                    var results = Search.getVideosFromYouTubeSearchData(data);
                    $.each(results, function(i, video) {
                        video.parent = self;
                        video.onPlayCallback = self.videoPlayCallback;
                        video.createListView().appendTo(self.$tracklist);
                    });
                }
                callback(self);
            });
        });
    };
}

var ExternalUserManager = {
    subscriptions: [],

    init: function() {
        var self = this;
        if (UserManager.isLoggedIn()) {
            Menu.getGroup('external-user-subscriptions').showLoadingAnimation();
            $.getJSON('/me/external_user_subscriptions', function(data) {
                Menu.getGroup('external-user-subscriptions').hideLoadingAnimation();
                $.each(data, function(i, subscription) {
                    self.subscriptions.push(new ExternalUser(subscription));
                });
                self.updateMenu();
                EventSystem.callEventListeners('external_user_subscriptions_loaded');
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

    setMenuItemAsPlayingFor: function(externalUser) {
        $.each(this.subscriptions, function(i, subscription) {
            if (externalUser.equals(subscription)) {
                subscription.getMenuItem().setAsPlaying();
                return;
            }
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
                }
            }
        });
    }
};
