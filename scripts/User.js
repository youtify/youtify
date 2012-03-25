function User(args) {
    var self = this;
    self.id = args.id;
    self.nickname = args.nickname;
    self.displayname = args.displayname;
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
                    EventSystem.callEventListeners('user_profile_updated', params);
                },
                409 : function(data) {
                    LoadingBar.hide();
                    alert('Nickname is already taken');
                }
            }
        });
    };

    self.addFollower = function(userId, userDisplayName, smallImageUrl) {
        self.followers.push({
            id: userId,
            displayname: userDisplayName,
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
            displayname: userDisplayName,
            smallImageUrl: smallImageUrl
        });
    };

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
