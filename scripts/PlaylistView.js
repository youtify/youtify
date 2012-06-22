var PlaylistView = {
    createSmallPlaylistView: function(playlist, index, showPrivacyToggle) {
        var i = 0,
            $box = $('<div class="playlist-box"/>'),
            $header = $('<div class="header"/>'),
            $title = $('<span class="title"/>'),
            $titleLink = $('<span class="playlist-title link"/>'),
            $subscribeButton = $('<span class="subscribe"/>').text('Subscribe'),
            $unsubscribeButton = $('<span class="unsubscribe"/>').text('Unsubscribe'),
            $tracklistContainer = $('<div class="tracklist-container minimized"/>'),
            $tracklist = $('<table class="tracklist"/>');

        /* Title */
        $titleLink.text(playlist.title).click(function() {
            if (playlist.playlistDOMHandle === null) {
                playlist.createViews();
            }

            if (playlist.remoteId) {
                history.pushState(null, null, playlist.getUrl());
            } else {
                history.pushState(null, null, '/');
            }

            PlaylistView.loadPlaylistView(playlist);
        }).appendTo($title);
        
        /* Stats */
        $title.append($('<span class="nr"/>').text(playlist.videos.length));
        if (playlist.remoteId !== null && !playlist.isPrivate) {
            $('<span class="subscribers"/>')
                .text(playlist.followers.length)
                .click(function() {
                    PlaylistView.displaySubscribersPopupForPlaylist($(this), playlist);
                })
                .appendTo($title);
        }
        
        /* Subscribe/Unsubscribe */
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
        if (logged_in && playlist.owner && playlist.owner.id !== UserManager.currentUser.id) {
            $title.append($subscribeButton);
            $title.append($unsubscribeButton);
        }
        if (playlist.isSubscription) {
            $subscribeButton.hide();
        } else {
            $unsubscribeButton.hide();
        }

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
        
        if (playlist.owner) {
            playlist.owner.getSmallView().appendTo($title);
        }
        
        /* Privacy checkbox*/
        if (showPrivacyToggle && playlist.remoteId !== null && my_user_id === playlist.owner.id) {
            PlaylistView.createPrivacyToggleButton(playlist).appendTo($title);
        }
        
        /* Append */
        $header.append($title);
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
        var i = 0,
            $playlistBar = $('#right > .playlists .info'),
            $privacy = $playlistBar.find('.privacy input');

        $playlistBar.data('model', playlist);
        $playlistBar.find('.title').text(playlist.title);
        $playlistBar.find('.privacy').hide();
        $privacy.unbind('click');
        $playlistBar.find('.user').hide();
        $playlistBar.find('.sync').hide().unbind('click');
        $playlistBar.find('.subscribe').hide().unbind('click');
        $playlistBar.find('.unsubscribe').hide().unbind('click');
        $playlistBar.find('.followers').hide().unbind('click');

        if(playlist.owner) {
            if (playlist.followers.length) {
                $playlistBar.find('.subscribers')
                    .text(TranslationSystem.get('Subscribers ($nr)', {$nr: playlist.followers.length}))
                    .unbind('click')
                    .click(function() {
                        PlaylistView.displaySubscribersPopupForPlaylist($(this), playlist);
                    })
                    .show();
            }

            /* Show subscription button */
            if(logged_in) {
                if (playlist.owner.id !== UserManager.currentUser.id) {
                    $playlistBar.find('.user').replaceWith(playlist.owner.getSmallView()).show();
                }
                if(playlist.isSubscription) {
                    $playlistBar.find('.unsubscribe').show().click(function () {
                        playlist.unsync(function () {
                            playlist.leftMenuDOMHandle.remove();
                            PlaylistView.updatePlaylistBar(playlist);
                        });
                    });
                } else if(Number(playlist.owner.id) !== Number(UserManager.currentUser.id)) {
                    $playlistBar.find('.subscribe').click(function () {
                        playlist.subscribe(function () {
                            PlaylistView.updatePlaylistBar(playlist);
                        });
                    }).show();
                } else {
                    $playlistBar.find('.privacy').replaceWith(PlaylistView.createPrivacyToggleButton(playlist));
                }
            }
        }
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
