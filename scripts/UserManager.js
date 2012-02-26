
var UserManager = {
    self: this,
    currentUser: null,
    
    init: function(userJSON) {
        self.currentUser = new User(userJSON);
        
        /* There is no user */
        if (self.currentUser === null) {
            $('#top .profile').hide();
            return;
        }
        
        /* Set click events */
        $('#right .profile .picture-container .picture-overlay .change-picture')
            .click(function() {
                $('#right .profile .picture-container .change').show();
            });
        $('#right .profile .picture-container .change .save')
            .click(function() {
                $('#right .profile .picture-container .change').hide();
                self.currentUser.saveGravatarAddress($('#right .profile .picture-container .change input').val());
            });
        
        /* Populate fields */
        if (self.currentUser.nickname) {
            $('#top .profile .nickname').text(self.currentUser.nickname);
        } else {
            $('#top .profile .nickname').text(self.currentUser.email);
        }
        $('#top .profile .picture').attr('src', self.currentUser.imageUrls.small);
        $('#top .profile').show();
    },
    populateUserProfile: function(user) {
        $('#right .profile .picture-container .picture').attr('src', self.currentUser.imageUrls.large);
    }
};