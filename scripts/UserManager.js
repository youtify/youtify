
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
        $('#right .profile .information-container .change .save')
            .click(function() {
                UserManager.currentUser.saveProfile(UserManager.getInformationFormValues());
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
    getInformationFormValues: function() {
        var ret = {};
        $.each($('#right .profile .information-container .change input'), function(i, elem) {
            ret[elem.name] = elem.value;
        });
        console.log(ret);
        return ret;
    },
    populateUserProfile: function(user) {
        /* Also called from Menu.js */
        $('#right .profile .picture-container .picture').attr('src', user.imageUrls.large);

        $('#right .profile .information-container .change input[name=nickname]').val(user.nickname);
        $('#right .profile .information-container .change input[name=first_name]').val(user.firstName);
        $('#right .profile .information-container .change input[name=last_name]').val(user.lastName);
        $('#right .profile .information-container .change input[name=tagline]').val(user.tagline);

        $('#right .profile .picture-container .change input').val(user.gravatarEmail);
    },
    findUser: function(nickOrId, callback) {
        $.getJSON('/api/users/' + nickOrId, function(data) {
             callback(data);
        });
    },
    showUser: function(user) {
        Menu.deSelectAll();
        UserManager.populateUserProfile(user);
    }
};