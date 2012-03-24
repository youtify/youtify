
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
        $.each($('#right .profile .information-container .change input, #right .profile .information-container .change textarea'), function(i, elem) {
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
                    UserManager.populateUserProfile(new User(data));
                },
                404: function(data) {
                    alert('User "' + nickOrId + '" not found');
                }
            }
        });
    },
    populateUserProfile: function(user) {
        /* Also called from Menu.js */
       
        LoadingBar.show();
               
        var $playlists = $('#right .profile .playlists'),
            $followings = $('#right .profile .followings'),
            $followers = $('#right .profile .followers'),
            $followButton = $('#right .profile .follow.button'),
            $unFollowButton = $('#right .profile .unfollow.button'),
            largeImageUrl = user.largeImageUrl || '/images/user.png',
            img = $('#right .profile .picture-container .picture');

        if (img.length === 0) {
            $('<img class="picture" alt="Profile picture" />')
                .attr('src', largeImageUrl)
                .prependTo($('#right .profile .picture-container'));
        } else {
            img.attr('src', largeImageUrl);
        }

        $('#right .profile .follow.button').unbind('click').click(function() {
            $.post('/me/followings/' + user.id, function(data) {
                $followButton.hide();
                $unFollowButton.show();
            });
        });

        $('#right .profile .unfollow.button').unbind('click').click(function() {
            $.ajax({
                type: 'DELETE',
                url: '/me/followings/' + user.id,
                statusCode: {
                    200: function(data) {
                        $followButton.show();
                        $unFollowButton.hide();
                    }
                }
            });
        });

        if (UserManager.currentUser.id === user.id) {
            $followButton.hide();
            $unFollowButton.hide();
        }
        else if (UserManager.currentUser.isFollowingUser(user.id)) {
            $followButton.hide();
            $unFollowButton.show();
        } else {
            $followButton.show();
            $unFollowButton.hide();
        }

        if (user.id === my_user_id) {
            $('#right .profile .static').hide();
            $('#right .profile .change').show();

            $('#right .profile .information-container .change input[name=nickname]').val(user.nickname);
            $('#right .profile .information-container .change input[name=first_name]').val(user.firstName);
            $('#right .profile .information-container .change input[name=last_name]').val(user.lastName);
            $('#right .profile .information-container .change textarea[name=tagline]').val(user.tagline);
            
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
            if (user.fullName) {
                $('#right .profile .static .full-name').text(user.fullName);
            } else {
                $('#right .profile .static .full-name').text('');
            }
            if (user.tagline) {
                $('#right .profile .static .tagline').text(user.tagline);
            } else {
                $('#right .profile .static .tagline').text('');
            }
        }

        $playlists.html('');
        
        $.each(user.playlists, function(index, playlist) {
            if ((user.id !== my_user_id) && (playlist.isPrivate === true || playlist.videos.length === 0)) {
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
            
            for (i = 0; i < playlist.videos.length; i += 1) {
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
            if (user.id === my_user_id && playlist.remoteId !== null) {
                var $privacyContainer = $('<div class="privacy"/>'),
                    $privacy = $('<input type="checkbox"/>'),
                    $privacyLabel = $('<label class="translatable"/>').text("Public");
                $privacy.attr('checked', !playlist.isPrivate);
                $privacy.change(function() {
                    /* Reversed */
                    playlist.isPrivate = !$privacy.is(':checked');
                    playlist.synced = false;
                    playlist.sync();
                });
                $privacyContainer
                    .append($privacy)
                    .append($privacyLabel)
                    .appendTo($box);
            }
            $tracklistContainer.append($tracklist);
            $box.append($tracklistContainer);
            if (playlist.videos.length > 5) {
                $box.append($more);
            }
            $box.appendTo($playlists);
        });

        function createListElem(userId, userName) {
            return $('<p class="user">' + userName + '</p>').click(function() {
                history.pushState(null, null, '/users/' + userId);
                Menu.deSelectAll();
                UserManager.loadProfile(userId);
            });
        }

        $followings.html('');
        $.each(user.followings, function(i, item) {
            $followings.append(createListElem(item.id, item.name));
        });

        $followers.html('');
        $.each(user.followers, function(i, item) {
            $followers.append(createListElem(item.id, item.name));
        });

        LoadingBar.hide();
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
