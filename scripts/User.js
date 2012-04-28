function User(args) {
    var self = this;
    self.id = args.id;
    self.nickname = args.nickname;
    self.displayName = args.displayName;
    self.flattrUserName = args.flattr_user_name;
    self.email = args.email || '';
    self.largeImageUrl = args.largeImageUrl || null;
    self.smallImageUrl = args.smallImageUrl || null;
    self.firstName = args.firstName || '';
    self.lastName = args.lastName || '';
    self.fullName = $.trim(self.firstName + ' ' + self.lastName);
    self.nrOfFollowers = args.nr_of_followers;
    self.nrOfFollowings = args.nr_of_followings;
    self.nrOfPlaylists = args.nr_of_playlists;
    self.tagline = args.tagline || '';

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

    self.getSmallView = function() {
        var $user = $('<span class="user small link"></span>');

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
    };
}
