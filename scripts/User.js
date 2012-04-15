function User(args) {
    var self = this;
    self.id = args.id;
    self.nickname = args.nickname;
    self.displayName = args.displayName;
    self.email = args.email || '';
    self.largeImageUrl = args.largeImageUrl || null;
    self.smallImageUrl = args.smallImageUrl || null;
    self.firstName = args.firstName || '';
    self.lastName = args.lastName || '';
    self.fullName = $.trim(self.firstName + ' ' + self.lastName);
    self.tagline = args.tagline || '';
    self.playlists = [];
    self.followings = args.followings || [];
    self.followers = args.followers || [];

    if (args.playlists) {
        $.each(args.playlists, function(i, item) {
            self.playlists.push(new Playlist(item.title, item.videos, item.remoteId, item.owner, item.isPrivate, item.followers));
        });
    }

    self.saveProfile = function(params) {
        LoadingBar.show();

        $.ajax({
            type : 'POST',
            url : '/me/profile',
            data : params,
            statusCode : {
                200 : function(data, textStatus) {
                    LoadingBar.hide();
                    params.displayName = data;
                    EventSystem.callEventListeners('user_profile_updated', params);
                },
                400 : function(data, textStatus) {
                    alert(data.responseText);
                    LoadingBar.hide();
                },
                409 : function(data) {
                    alert('Nickname is already taken');
                    LoadingBar.hide();
                }
            }
        });
    };

    self.getUrl = function() {
        if (this.nickname) {
            return '/users/' + this.nickname;
        } else {
            return '/users/' + this.id;
        }
    };

    self.addFollower = function(userId, userDisplayName, smallImageUrl) {
        self.followers.push({
            id: userId,
            displayName: userDisplayName,
            smallImageUrl: smallImageUrl
        });
    };

    self.removeFollower = function(userId) {
        var newFollowers = [];
        $.each(self.followers, function(i, item) {
            if (item.id !== userId) {
                newFollowers.push(item);
            }
        });
        self.followers = newFollowers;
    };

    self.removeFollowing = function(userId) {
        var newFollowings = [];
        $.each(self.followings, function(i, item) {
            if (item.id !== userId) {
                newFollowings.push(item);
            }
        });
        self.followings = newFollowings;
    };

    self.addFollowing = function(userId, userDisplayName, smallImageUrl) {
        self.followings.push({
            id: userId,
            displayName: userDisplayName,
            smallImageUrl: smallImageUrl
        });
    };

    self.getSmallView = function() {
        var $user = $('<span class="user small"></span>');

        $('<img />').attr('src', self.smallImageUrl).appendTo($user);
        $('<span class="name"></span>').text(self.displayName).appendTo($user);

        $user.click(function() {
            history.pushState(null, null, self.getUrl());
            UserManager.doFakeProfileMenuClick();
            if (logged_in && self.id === UserManager.currentUser.id) {
                UserManager.loadCurrentUser();
            } else {
                UserManager.loadProfile(self.id);
            }
        });

        return $user;
    },

    self.isFollowingUser = function(userId) {
        var ret = false;

        $.each(self.followings, function(i, item) {
            if (item.id === userId) {
                ret = true;
                return false;
            }
        });

        return ret;
    };
}
