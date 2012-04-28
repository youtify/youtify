
var UserManager = {
    currentUser: null,
    $playlists: null,
    $followings: null,
    $followers: null,
    $playlistsTab: null,
    $followingsTab: null,
    $followersTab: null,
    $followButton: null,
    $unFollowButton: null,
    $editButton: null,
    $img: null,
    $changePictureBox: null,
    $gravatarEmail: null,
    
    init: function(userJSON) {
        if (userJSON) {
            UserManager.currentUser = new User(userJSON);
            EventSystem.addEventListener('user_profile_updated', function(params) {
                UserManager.currentUser.displayName = params.displayName;
                UserManager.currentUser.nickname = params.nickname;
                UserManager.currentUser.firstName = params.first_name;
                UserManager.currentUser.lastName = params.last_name;
                UserManager.currentUser.tagline = params.tagline;
                UserManager.loadCurrentUser();
                history.pushState(null, null, UserManager.currentUser.getUrl());
            });
        }

        UserManager.$playlists = $('#right .profile .pane.profile-playlists');
        UserManager.$followings = $('#right .profile .pane.profile-followings');
        UserManager.$followers = $('#right .profile .pane.profile-followers');
        UserManager.$playlistsTab = $('#right .profile .tabs .profile-playlists');
        UserManager.$followingsTab = $('#right .profile .tabs .profile-followings');
        UserManager.$followersTab = $('#right .profile .tabs .profile-followers');
        UserManager.$followButton = $('#right .profile .follow.button');
        UserManager.$unFollowButton = $('#right .profile .unfollow.button');
        UserManager.$editButton = $('#right .profile .edit.button');
        UserManager.$img = $('#right .profile .picture-container .picture');
        UserManager.$changePictureBox = $('#right .profile .picture-container .change');
        UserManager.$gravatarEmail = $('#right .profile .picture-container .change .email');
    },
    doFakeProfileMenuClick: function() {
        Menu.deSelectAll();

        Menu.profile.rightView.show();
        Menu.profile.leftView.addClass('selected');

        Menu.profile.tabs[0].select();
    },
    loadCurrentUser: function() {
        UserManager.resetUserProfileView();
        UserManager.populateUserProfile(UserManager.currentUser);
    },
    loadProfile: function(nickOrId) {
        UserManager.resetUserProfileView();

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
                404: function(data, textStatus) {
                    alert('User "' + nickOrId + '" not found');
                }
            }
        });
    },
    resetUserProfileView: function() {
        UserManager.$followButton.hide();
        UserManager.$unFollowButton.hide();
        UserManager.$editButton.hide();
        UserManager.$changePictureBox.hide();
        UserManager.$gravatarEmail.text('');
        UserManager.$playlists.html('');
        UserManager.$followings.html('');
        UserManager.$followers.html('');

        if (UserManager.$img) {
            UserManager.$img.remove();
        }

        $('#right .profile .information-container .flattr-user-name').text('').hide();
        $('#right .profile .information-container .display-name').text('');
        $('#right .profile .information-container .nickname').text('');
        $('#right .profile .information-container .tagline').text('');

        Menu.profile.tabs[0].select();

        $('#right .profile .tabs').hide();
    },
    populateUserProfile: function(user) {
        /* Also called from Menu.js */
               
        var largeImageUrl = user.largeImageUrl;

        UserManager.$img = $('<img class="picture" alt="Profile picture" />')
            .attr('src', largeImageUrl)
            .prependTo($('#right .profile .picture-container'));

        UserManager.$followButton.unbind('click').click(function() {
            $.post('/me/followings/' + user.id, function(data) {
                UserManager.$followButton.hide();
                UserManager.$unFollowButton.show();

                user.addFollower(UserManager.currentUser.id, UserManager.currentUser.displayName, UserManager.currentUser.smallImageUrl);
                UserManager.currentUser.addFollowing(user.id, user.displayName, UserManager.currentUser.smallImageUrl);
                updateFollowersView();
            });
        });

        UserManager.$unFollowButton.unbind('click').click(function() {
            $.ajax({
                type: 'DELETE',
                url: '/me/followings/' + user.id,
                statusCode: {
                    200: function(data) {
                        UserManager.$followButton.show();
                        UserManager.$unFollowButton.hide();

                        user.removeFollower(UserManager.currentUser.id, UserManager.currentUser.displayName);
                        UserManager.currentUser.removeFollowing(user.id, user.displayName);
                        updateFollowersView();
                    }
                }
            });
        });

        UserManager.$editButton.unbind('click').click(function() {
            new EditProfileDialog().show();
        });

        if (logged_in && UserManager.currentUser.id === user.id) {
            user.playlists = playlistManager.playlists;
            UserManager.$editButton.show();
            UserManager.$gravatarEmail.text(UserManager.currentUser.email);
            UserManager.$changePictureBox.show();
        } else if (logged_in && UserManager.currentUser.isFollowingUser(user.id)) {
            UserManager.$unFollowButton.show();
        } else if (logged_in) {
            UserManager.$followButton.show();
        }

        if (user.flattrUserName) {
            $('#right .profile .information-container .flattr-user-name')
                .text(user.flattrUserName)
                .attr('href', 'http://flattr.com/profile/' + user.flattrUserName)
                .show();
        }

        $('#right .profile .information-container .display-name').text(user.displayName);
        $('#right .profile .information-container .nickname').text(user.nickname);
        $('#right .profile .information-container .tagline').text(user.tagline);

        UserManager.$playlistsTab.text('Playlists (' + user.playlists.length + ')');
        $.each(user.playlists, function(index, playlist) {
            if ((user.id !== my_user_id) && (playlist.isPrivate === true || playlist.videos.length === 0)) {
                return;
            }
            var i = 0,
                $box = $('<div class="playlist-box"/>'),
                $title = $('<span class="title"/>'),
                $subscribeButton = $('<button class="button subscribe"></button>').text('Subscribe'),
                $unsubscribeButton = $('<button class="button unsubscribe"></button>').text('Unsubscribe'),
                $tracklistContainer = $('<div class="tracklist-container minimized"/>'),
                $tracklist = $('<table class="tracklist"/>');
            
            /* Title click */
            $title.append($('<span class="link"></span>').text(playlist.title));
            $title.append($('<span class="nr"></span>').text(' (' + playlist.videos.length + ')'));
            $title.click(function() {
                if (playlist.playlistDOMHandle === null) {
                    playlist.createViews();
                }

                if (playlist.remoteId) {
                    history.pushState(null, null, playlist.getUrl());
                } else {
                    history.pushState(null, null, '/');
                }

                PlaylistView.loadPlaylistView(playlist);
            });

            if (playlist.isSubscription) {
                $subscribeButton.hide();
            } else {
                $unsubscribeButton.hide();
            }

            $subscribeButton.click(function() {
                playlist.subscribe();
                $(this).hide();
                $(this).next().show();
            });

            $unsubscribeButton.click(function() {
                playlistManager.deletePlaylist(index); // delete unsubscribes
                $(this).hide();
                $(this).prev().show();
            });

            for (i = 0; i < Math.min(playlist.videos.length, 5); i += 1) {
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

            if (logged_in && user.id !== UserManager.currentUser.id && playlist.owner.id !== UserManager.currentUser.id) {
                $box.append($subscribeButton);
                $box.append($unsubscribeButton);
            }

            if(user.id === my_user_id && my_user_id === playlist.owner.id && playlist.remoteId !== null) {
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
            $box.appendTo(UserManager.$playlists);
        });

        function updateFollowingsView() {
            UserManager.$followings.html('');
            UserManager.$followingsTab.text('Following (' + user.followings.length + ')');
            $.each(user.followings, function(i, item) {
                UserManager.$followings.append(new User(item).getSmallView());
            });
        }

        function updateFollowersView() {
            UserManager.$followers.html('');
            UserManager.$followersTab.text('Followers (' + user.followers.length + ')');
            $.each(user.followers, function(i, item) {
                UserManager.$followers.append(new User(item).getSmallView());
            });
        }

        updateFollowersView();
        updateFollowingsView();

        $('#right .profile .tabs').show();
    },
    findUser: function(nickOrId, callback) {
        $.getJSON('/api/users/' + nickOrId, function(data) {
             callback(data);
        });
    }
};
