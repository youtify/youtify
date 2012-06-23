var PlaylistView = {
    createPlaylistHeader: function(playlist, showPrivacyToggle) {
        var $header = $('<div class="playlist-header"/>'),
            $info = $('<div class="info"/>'),
            $subscribeButton = $('<span class="translatable subscribe"/>').text(TranslationSystem.get('Subscribe')),
            $unsubscribeButton = $('<span class="translatable unsubscribe"/>').text(TranslationSystem.get('Unsubscribe'));

        /* Title */
        $('<span class="title link"/>').text(playlist.title).click(function() {
            if (playlist.playlistDOMHandle === null) {
                playlist.createViews();
            }

            if (playlist.remoteId) {
                history.pushState(null, null, playlist.getUrl());
            } else {
                history.pushState(null, null, '/');
            }

            PlaylistView.loadPlaylistView(playlist);
        }).appendTo($header);

        /* Playlist owner */
        if (playlist.owner) {
            playlist.owner.getSmallView().appendTo($info);
        }
        
        /* Number of tracks */
        $info.append($('<span class="nr"/>').text(playlist.videos.length));

        /* Number of subscribers */
        if (playlist.remoteId !== null && !playlist.isPrivate) {
            $('<span class="subscribers"/>')
                .text(playlist.followers.length)
                .click(function() {
                    PlaylistView.displaySubscribersPopupForPlaylist($(this), playlist);
                })
                .appendTo($info);
        }
        
        /* Subscribe/Unsubscribe button */
        $subscribeButton.click(function() {
            playlist.subscribe();
            $(this).hide();
            $(this).next().show();
        });
        $unsubscribeButton.click(function() {
            playlistManager.deletePlaylist(playlist); // delete unsubscribes
            $(this).hide();
            $(this).prev().show();
        });
        if (logged_in && playlist.owner && playlist.owner.id !== UserManager.currentUser.id) {
            $info.append($subscribeButton);
            $info.append($unsubscribeButton);
        }
        if (playlist.isSubscription) {
            $subscribeButton.hide();
        } else {
            $unsubscribeButton.hide();
        }
        
        /* Privacy checkbox*/
        if (showPrivacyToggle && playlist.remoteId !== null && my_user_id === playlist.owner.id) {
            PlaylistView.createPrivacyToggleButton(playlist).appendTo($info);
        }

        $info.appendTo($header);

        return $header;
    },

    createSmallPlaylistView: function(playlist, showPrivacyToggle) {
        var i = 0,
            $box = $('<div class="playlist-box"/>'),
            $header = PlaylistView.createPlaylistHeader(playlist, showPrivacyToggle),
            $tracklistContainer = $('<div class="tracklist-container minimized"/>'),
            $tracklist = $('<table class="tracklist"/>');

        /* Playlist grid */
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
        
        $box.append($header);
        $tracklistContainer.append($tracklist);
        $box.append($tracklistContainer);

        return $box;
    },

    displaySubscribersPopupForPlaylist: function($buttonElem, playlist) {
        var $popup = $('#playlist-subscribers-popup').html('');
        $.each(playlist.followers, function(i, user) {
            $popup.append(new User(user).getSmallView());
        });
        $popup.find('.user').click(function() {
            $('#arrow-popup-blocker').click(); // hide arrow popup when clicking user in popup
        });
        $buttonElem.arrowPopup('#playlist-subscribers-popup');
    },

    updatePlaylistBar: function(playlist) {
        $('#right > .playlists .playlist-header').replaceWith(PlaylistView.createPlaylistHeader(playlist, true));
    },

    createPrivacyToggleButton: function(playlist) {
        var $privacyContainer = $('<span class="privacy translatable"/>');
        if (playlist.isPrivate) {
            $privacyContainer.addClass('private');
            $privacyContainer.text(TranslationSystem.get('Private'));
        } else {
            $privacyContainer.addClass('public');
            $privacyContainer.text(TranslationSystem.get('Public'));
        }
        $privacyContainer.click(function() {
            playlist.isPrivate = !playlist.isPrivate;
            if (playlist.isPrivate) {
                $privacyContainer.removeClass('public');
                $privacyContainer.addClass('private');
                $privacyContainer.text(TranslationSystem.get('Private'));
            } else {
                $privacyContainer.removeClass('private');
                $privacyContainer.addClass('public');
                $privacyContainer.text(TranslationSystem.get('Public'));
            }
            playlist.synced = false;
            LoadingBar.show();
            playlist.sync(function() {
                LoadingBar.hide();
            });
        });
        return $privacyContainer;
    },

    loadPlaylistView: function (playlist) {
        $('#right > div').hide();

        $('#right > .playlists .pane').hide().removeClass('active');
        $('#left .menu li').removeClass('selected');

        playlist.playlistDOMHandle.addClass('active');
        playlist.leftMenuDOMHandle.addClass('selected');

        PlaylistView.updatePlaylistBar(playlist);
        if(playlist.playlistDOMHandle.find('.video').length !== playlist.videos.length) {
            playlist.playlistDOMHandle.html('');
            $.each(playlist.videos, function (i, item) {
                if(item) {
                    $video = item.createListView();
                    $video.addClass('droppable');
                    $video.addClass('draggable');
                    if(!playlist.isSubscription) {
                        $video.data('additionalMenuButtons', [{
                            title: TranslationSystem.get('Delete'),
                            cssClass: 'delete',
                            args: $video,
                            callback: PlaylistView.deleteVideoButtonClicked
                        }]);

                        $video.addClass('reorderable');
                    }
                    $video.appendTo(playlist.playlistDOMHandle);
                }
            });
        }
        playlist.playlistDOMHandle.show();
        $('#right > .playlists').show();
    },

    syncPlaylistButtonClicked: function (event) {
        var playlist = playlistManager.getCurrentlySelectedPlaylist();
        console.log('syncing playlist ' + playlist.title);
        playlist.sync(function () {
            PlaylistView.updatePlaylistBar(playlist);
            playlistManager.save();
            playlist.getMenuView().addClass('remote');
            history.pushState(null, null, playlist.getUrl());
        });
    },

    showPlaylistSharePopup: function (playlist, elem, arrowDirection) {
        $('#share-playlist-popup .link input').val(playlist.getUrl());

        $('#share-playlist-popup .twitter')
            .unbind('click')
            .click(function (event) {
                event.preventDefault();
                window.open(playlist.getTwitterShareUrl(), 'Share playlist on Twitter', 400, 400);
                return false;
            });

        $('#share-playlist-popup .facebook')
            .unbind('click')
            .click(function (event) {
                event.preventDefault();
                window.open(playlist.getFacebookShareUrl(), 'Share playlist on Facebook', 400, 400);
                return false;
            });

        elem.arrowPopup('#share-playlist-popup', arrowDirection);
    },

    shareButtonClicked: function (event) {
        var playlistBar = $(this).parent();
        var playlist = playlistBar.data('playlist');
        PlaylistView.showPlaylistSharePopup(playlist, $(this), 'up');
    },

    deleteVideoButtonClicked: function (li) {
        var playlist = playlistManager.getCurrentlySelectedPlaylist();
        var allSelectedVideos = li.parent().find('.video.selected');

        $.each(allSelectedVideos, function (index, item) {
            $video = $(item);
            playlist.deleteVideo($video.index());
            $video.remove();
        });

        playlistManager.save();
    }
};
