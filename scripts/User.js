function User(args) {
    var self = this;
    self.id = args.id;
    self.nickname = args.nickname;
    self.email = args.email || '';
    self.gravatarEmail = args.gravatarEmail || '';
    self.largeImageUrl = args.largeImageUrl || null;
    self.smallImageUrl = args.smallImageUrl || null;
    self.firstName = args.firstName || '';
    self.lastName = args.lastName || '';
    self.fullName = self.firstName + ' ' + self.lastName;
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
                },
                409 : function(data) {
                    LoadingBar.hide();
                    alert('Nickname is already taken');
                }
            }
        });
    };
}