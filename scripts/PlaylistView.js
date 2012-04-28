var PlaylistView = {
    updatePlaylistBar: function (playlist) {
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

        if(playlist.owner) {
            $playlistBar.find('.user').replaceWith(playlist.owner.getSmallView()).show();

            /* Show subscription button */
            if(logged_in) {
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
                    $playlistBar.find('.privacy').show();
                    $privacy.attr('checked', !playlist.isPrivate);
                    $privacy.change(function () {
                        /* Reversed */
                        playlist.isPrivate = !$privacy.is(':checked');
                        playlist.synced = false;
                        playlist.sync();
                    });
                }
            }
        }
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
                            title: 'Delete',
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
