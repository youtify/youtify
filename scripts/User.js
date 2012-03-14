

function User(args) {
    var self = this;
    self.id = args.id;
    self.nickname = args.nickname;
    self.email = args.email || '';
    self.gravatarEmail = args.gravatarEmail || '';
    self.imageUrls = {
        small: args.smallImageUrl || null,
        large: args.largeImageUrl || null
    };
    self.firstName = args.firstName || '';
    self.lastName = args.lastName || '';
    self.fullName = self.firstName + ' ' + self.lastName;
    self.tagline = args.tagline || '';
    
    self.saveGravatarAddress = function(address) {
        var params = {
            gravatar_email: address
        };
        $.post('/me/profile', params, function(data) {
            // done
        });
    };

    self.saveProfile = function(params) {
        $.post('/me/profile', params, function(data) {
            // done
        });
    };
}
