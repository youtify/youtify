
var UserManager = {
    currentUser: null,
    
    init: function(userJSON) {
        if (userJSON === null) {
            /* No logged in user */
            $('#top .profile').hide();
            return;
        }

        UserManager.currentUser = new User(userJSON);
        
        /* Set click events */
        $('#right .profile .picture-container .picture-overlay .change-picture')
            .click(function() {
                $('#right .profile .picture-container .change').show();
            });
        $('#right .profile .picture-container .change .save')
            .click(function() {
                $('#right .profile .picture-container .change').hide();
                UserManager.currentUser.saveGravatarAddress($('#right .profile .picture-container .change input').val());
            });
        
        /* Populate fields */
        if (UserManager.currentUser.nickname) {
            $('#top .profile .nickname').text(UserManager.currentUser.nickname);
        } else {
            $('#top .profile .nickname').text(UserManager.currentUser.email);
        }
        $('#top .profile .picture').attr('src', UserManager.currentUser.imageUrls.small);
        $('#top .profile').show();
    },
    populateUserProfile: function(user) {
        /* Called from Menu.js */
        $('#right .profile .picture-container .picture').attr('src', user.imageUrls.large);
    },
    showUserFromId: function(userId) {
    
    },
    showUserFromNick: function(userNick) {
        
    },
    showUser: function(user) {
        Menu.deSelectAll();
        UserManager.populateUserProfile(user);
    }
};