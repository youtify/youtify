

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
    self.lastName = null;
    self.fullName = self.firstName + ' ' + self.lastName;
    self.tagline = null;
    
    self.saveGravatarAddress = function(address) {
        var params = {
            gravatar_email: address
        };
        $.post('/me/gravatar_email', params, function(data) {
            // done
        });
    };
}
