
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
        $('#top .profile .picture').replaceWith('<img class="picture" src="'+ UserManager.currentUser.smallImageUrl + '" />');
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
        $.ajax({
            type: 'GET',
            url: '/api/users/' + nickOrId,
            complete: function(jqXHR, textStatus) {
                LoadingBar.hide();
            },
            statusCode: {
                200: function(data) {
                    $('#right .profile').show();
                    UserManager.populateUserProfile(data);
                },
                404: function(data) {
                    alert('User "' + nickOrId + '" not found');
                },
            }
        });
    },
    populateUserProfile: function(user) {
        /* Also called from Menu.js */
        var $playlists = $('#right .profile .playlists');
        
        if (user.largeImageUrl) {
            $('#right .profile .picture-container .picture').attr('src', user.largeImageUrl);
        } else {
            $('#right .profile .picture-container .picture').attr('src', '/images/user.png');
        }

        if (user.id === my_user_id) {
            $('#right .profile .static').hide();
            $('#right .profile .change').show();

            $('#right .profile .information-container .change input[name=nickname]').val(user.nickname);
            $('#right .profile .information-container .change input[name=first_name]').val(user.firstName);
            $('#right .profile .information-container .change input[name=last_name]').val(user.lastName);
            $('#right .profile .information-container .change input[name=tagline]').val(user.tagline);
            
            /* Use playlists from the playlist manager to also get newly created playlists */
            user.playlists = playlistManager.playlists;
        } else {
            $('#right .profile .change').hide();
            $('#right .profile .static').show();

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

        $playlists.html('');
        
        $.each(user.playlists, function(i, playlist) {
            if (playlist.isPrivate === true || playlist.videos.length === 0) {
                return;
            }
            var i = 0,
                $box = $('<div class="playlist-box"/>'),
                $title = $('<span class="title"/>').text(playlist.title),
                $tracklistContainer = $('<div class="tracklist-container minimized"/>'),
                $tracklist = $('<table class="tracklist"/>'),
                $more = $('<span class="more"/>').click(function() {
                    if ($tracklistContainer.hasClass('minimized')) {
                        $tracklistContainer.removeClass('minimized');
                        $tracklistContainer.css('height', $tracklist.height());
                    } else {
                        $tracklistContainer.addClass('minimized');
                        $tracklistContainer.removeAttr('style');
                    }
                }).html('&#8661;');
            
            for (i = 0; i < playlist.videos.length; i++) {
                if (playlist.videos[i]) {
                    var video = new Video({
                        title: playlist.videos[i].title,
                        type: playlist.videos[i].type,
                        videoId: playlist.videos[i].videoId,
                        duration: playlist.videos[i].duration
                    });
                    video.createListView()
                        .addClass('droppable')
                        .addClass('draggable')
                        .appendTo($tracklist);
                }
            }
            $box.append($title);
            $tracklistContainer.append($tracklist);
            $box.append($tracklistContainer);
            if (playlist.videos.length > 5) {
                $box.append($more);
            }
            $box.appendTo($playlists);
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
