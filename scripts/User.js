function User(args) {
    var self = this;
    self.id = args.id;
    self.nickname = args.nickname;
    self.email = args.email || '';
    self.largeImageUrl = args.largeImageUrl || null;
    self.smallImageUrl = args.smallImageUrl || null;
    self.firstName = args.firstName || '';
    self.lastName = args.lastName || '';
    self.fullName = $.trim(self.firstName + ' ' + self.lastName);
    self.tagline = args.tagline || '';
    self.playlists = args.playlists || [];
    self.followings = args.followings || [];
    self.followers = args.followers || [];

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
}