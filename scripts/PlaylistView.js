var PlaylistView = {
    createPlaylistHeader: function(playlist, showPrivacyToggle) {
        var $header = $('<div class="playlist-header"/>'),
            $info = $('<div class="info"/>'),
            $subscribeButton = $('<span class="translatable button subscribe"/>').text(TranslationSystem.get('Subscribe')),
            $unsubscribeButton = $('<span class="translatable button unsubscribe"/>').text(TranslationSystem.get('Unsubscribe'));

        /* Title */
        $('<span class="title link"/>').text(playlist.title).click(function() {
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
        if (UserManager.isLoggedIn() && playlist.owner && playlist.owner.id !== UserManager.currentUser.id) {
            $info.append($subscribeButton);
            $info.append($unsubscribeButton);
        }
        if (playlist.isSubscription) {
            $subscribeButton.hide();
        } else {
            $unsubscribeButton.hide();
        }
        
        /* Privacy checkbox*/
        if (showPrivacyToggle && playlist.remoteId !== null && UserManager.currentUser.id === playlist.owner.id) {
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
        if (playlist.getMenuItem().isSelected() && player.currentVideo && player.currentVideo.listView) {
            player.currentVideo.scrollTo();
        }

        $('#right > div').hide();
        $('#right > .playlists .tracklist').hide();
        $('#right > .playlists').show();

        var $tracklist =  playlist.getTrackList();
        $tracklist.show();

        PlaylistView.updatePlaylistBar(playlist);
        if ($tracklist.find('.video').length !== playlist.videos.length) {
            $tracklist.html('');
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
                    $video.appendTo($tracklist);
                }
            });
        }
        if (playlist.videos.length === 0) {
            $('#right .playlists .help-box').show();
        } else {
            $('#right .playlists .help-box').hide();
        }
    },

    syncPlaylistButtonClicked: function (event) {
        var playlist = playlistManager.getCurrentlySelectedPlaylist();
        playlist.sync(function () {
            PlaylistView.updatePlaylistBar(playlist);
            playlistManager.save();
            playlist.getMenuView().addClass('remote');
            history.pushState(null, null, playlist.getUrl());
        });
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
