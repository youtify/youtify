function leftmenu_Init() {
    constructPlaylistsMenu();

    // NEW PLAYLIST BUTTON
    $('#new-playlist span').click(function() {
        var suggestedTitle = '',
            artist;

        if (pendingVideo) {
            artist = extractArtist(pendingVideo.title);
            if (artist) {
                suggestedTitle = artist;
            }
        }

        $(this).hide();
        $('#new-playlist input').show()
            .focus()
            .select()
            .val(suggestedTitle);
    });
    $('#new-playlist input').blur(function() { 
        $('#new-playlist span').show();
        $(this).hide();
        pendingVideo = null;
    });

    // NEW PLAYLIST INPUT FIELD
    $('#new-playlist input').keyup(function(event) {
        var title,
            playlist,
            videos = [];

        switch (event.keyCode) {
            case 13: // RETURN
                $('#new-playlist input').hide();
                $('#new-playlist span').show();

                title = $.trim($(this).val());
                if (title.length > 0 && title.length < 50) {
                    if (pendingVideo) {
                        videos.push(pendingVideo);
                    }
                    playlist = new Playlist($(this).val(), videos);
                    playlist.createDOMRepresentations();
                    playlistManager.addPlaylist(playlist);
                    if (logged_in) {
                        playlist.createNewPlaylistOnRemote(function() {
                            playlistManager.save();
                        });
                    } else {
                        playlistManager.save();
                    }
                } else {
                    return;
                }

                $(this).val('');

                pendingVideo = null;
                break;
            case 27: // ESC
                $(this).hide();
                $('#new-playlist span').show();
                $(this).val('');
                pendingVideo = null;
                break;
        }

        event.stopPropagation();
    });
}

var pendingVideo; // used when a video is dragged into 'new playlist' input

/** INIT
 ****************************************************************************/

function constructPlaylistsMenu() {
    var i,
        li,
        playlist;

    $('#playlists').html('');

    for (i = 0; i < playlistManager.playlists.length; i += 1) {
        playlist = playlistManager.getPlaylist(i);
        li = playlist.createDOMRepresentations();
    }
}

