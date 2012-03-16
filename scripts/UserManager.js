
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
        $('#top .profile .picture').attr('src', UserManager.currentUser.smallImageUrl);
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
    loadProfile: function(nickOrId) {
        LoadingBar.show();
        $.get('/api/users/' + nickOrId, function(data) {
            $('#right .profile').show();
            UserManager.populateUserProfile(data);
            LoadingBar.hide();
        });
    },
    populateUserProfile: function(user) {
        /* Also called from Menu.js */

        if (user.id === my_user_id) {
            $('#right .profile .static').hide();
            $('#right .profile .change').show();

            $('#right .profile .picture-container .picture').attr('src', user.largeImageUrl);
            $('#right .profile .information-container .change input[name=nickname]').val(user.nickname);
            $('#right .profile .information-container .change input[name=first_name]').val(user.firstName);
            $('#right .profile .information-container .change input[name=last_name]').val(user.lastName);
            $('#right .profile .information-container .change input[name=tagline]').val(user.tagline);
        } else {
            $('#right .profile .change').hide();
            $('#right .profile .static').show();

            $('#right .profile .picture-container .picture').attr('src', user.largeImageUrl);
            if (user.nickname) {
                $('#right .profile .static .nickname').text(user.nickname);
            } else {
                $('#right .profile .static .nickname').text('Anonymous');
            }
            if (user.fullname) {
                $('#right .profile .static .fullname').text(user.fullname);
            } else {
                $('#right .profile .static .fullname').text('');
            }
            if (user.tagline) {
                $('#right .profile .static .tagline').text(user.tagline);
            } else {
                $('#right .profile .static .tagline').text('');
            }
        }

        $.each(user.playlists, function(i, playlist) {
           // @todo replace with playlist 'boxes'
           $('<span></span>')
               .click(function() {
                   history.pushState(null, null, '/users/' + user.id + '/playlists/' + playlist.remoteId);
                   loadPlaylist(playlist.remoteId);
               })
               .text(playlist.title + ' (' + playlist.videos.length + ' videos)')
               .appendTo('#right .profile .playlists');
        });
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
