var PlaylistView = {
    updatePlaylistBar: function(playlist) {
        var i = 0,
            $playlistBar = $('#right > .playlists .info');

        $playlistBar.data('model', playlist);
        $playlistBar.find('.title').text(playlist.title);
        $playlistBar.find('.owner').hide();
        $playlistBar.find('.copy').hide().unbind('click');
        $playlistBar.find('.sync').hide().unbind('click');
        $playlistBar.find('.subscribe').hide().unbind('click');
        
        if (playlist.owner) {
            $playlistBar.find('.owner').click(function() {
                history.pushState(null, null, '/users/' + playlist.owner.id);
                Menu.deSelectAll();
                UserManager.loadProfile(playlist.owner.id);
            }).text(playlist.owner.displayName).show();

            // Add save button if not already saved
            if (!playlistManager.getPlaylistsMap().hasOwnProperty(playlist.remoteId)) {
               $playlistBar.find('.copy').show().one('click', PlaylistView.savePlaylistButtonClicked);
            }
            /* Show subscription button */
            if (logged_in && Number(playlist.owner.id) !== Number(UserManager.currentUser.id) && logged_in && playlist.isSubscription === false) {
                for (i = 0; i < playlist.followers.length; i+=1) {
                    if (Number(playlist.followers[i].id) === Number(UserManager.currentUser.id)) {
                        return;
                    }
                }
                $playlistBar.find('.subscribe').click(function() {
                    playlist.subscribe(function() {
                        PlaylistView.loadPlaylistView(playlist);
                    });
                }).show();
            }
        } else if (logged_in) {
            $playlistBar.find('.sync').show().one('click', PlaylistView.syncPlaylistButtonClicked);
        }
    },

    loadPlaylistView: function(playlist) {
        $('#right > div').hide();
        
        $('#right > .playlists .pane').hide().removeClass('active');
        $('#left .menu li').removeClass('selected');
        
        playlist.playlistDOMHandle.addClass('active');
        playlist.leftMenuDOMHandle.addClass('selected');

        PlaylistView.updatePlaylistBar(playlist);
        if (playlist.playlistDOMHandle.find('.video').length !== playlist.videos.length) {
            playlist.playlistDOMHandle.html('');
            $.each(playlist.videos, function(i, item) {
                if (item) {
                    $video = item.createListView();
                    $video.addClass('droppable');
                    $video.addClass('draggable');
                    if (!playlist.isSubscription) {
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

    savePlaylistButtonClicked: function(event) {
        var $playlistBar = $('#right > .playlists .info');
        var playlist = $playlistBar.data('model');
        var newPlaylist = playlist.copy(); // create copy without connection to remote

        newPlaylist.createViews();
        playlistManager.addPlaylist(newPlaylist);
        newPlaylist.getMenuView().appendTo('#left .playlists ul');

        if (logged_in) {
            newPlaylist.createNewPlaylistOnRemote(function() {
                playlistManager.save();
                newPlaylist.getMenuView().addClass('remote');
            });
        } else {
            playlistManager.save();
        }

        $playlistBar.find('.copy').hide();
   },

    syncPlaylistButtonClicked: function(event) {
        var playlist = playlistManager.getCurrentlySelectedPlaylist();
        console.log('syncing playlist ' + playlist.title);
        playlist.sync(function() {
            PlaylistView.updatePlaylistBar(playlist);
            playlistManager.save();
            playlist.getMenuView().addClass('remote');
            history.pushState(null, null, playlist.getUrl());
        });
    },

    showPlaylistSharePopup: function(playlist, elem, arrowDirection) {
        $('#share-playlist-popup .link input').val(playlist.getUrl());

        $('#share-playlist-popup .twitter')
            .unbind('click')
            .click(function(event) {
                event.preventDefault();
                window.open(playlist.getTwitterShareUrl(), 'Share playlist on Twitter', 400, 400);
                return false;
            });

        $('#share-playlist-popup .facebook')
            .unbind('click')
            .click(function(event) {
                event.preventDefault();
                window.open(playlist.getFacebookShareUrl(), 'Share playlist on Facebook', 400, 400);
                return false;
            });

        elem.arrowPopup('#share-playlist-popup', arrowDirection);
    },

    shareButtonClicked: function(event) {
        var playlistBar = $(this).parent();
        var playlist = playlistBar.data('playlist');
        PlaylistView.showPlaylistSharePopup(playlist, $(this), 'up');
    }
}
