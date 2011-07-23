function sync(playlistElem) {
    var playlists = JSON.parse(localStorage.playlists || '[]'),
        playlist = playlists[playlistElem.index()],
        remoteID = playlist.remoteID;

    if (remoteID === null) {
        pushRemotePlaylist(playlist, playlistElem);
        return;
    } else {
        updateRemotePlaylist(playlist, playlistElem);
    }

    if (playlist.isPrivate) {
        playlistElem.addClass('loading');
        getVidsInPrivatePlaylist(remoteID, function (vids) {
            playlistElem.removeClass('loading');
            $.each(vids, function(i, item) {
                var videoId = item['media$group']['yt$videoid']['$t'],
                    title = item['title']['$t'];

                playlist.videos.push({
                    videoId: videoId,
                    title: title,
                });
            });
            localStorage.playlists = JSON.stringify(playlists);
        });
    } else {
        getVidsInPlaylist(remoteID, function(vids) {
            $.each(vids, function(i, item) {
                var videoId = item['media$group']['yt$videoid']['$t'],
                    title = item['title']['$t'];

                playlist.videos.push({
                    videoId: videoId,
                    title: title,
                });
            });
            localStorage.playlists = JSON.stringify(playlists);
        }, {'playlist': playlistElem});
    }
}

function pushRemotePlaylist(playlist, playlistElem) {
    var url = '/playlists',
        params = {
            title: playlist.title,
            videos: getSimpleVideoListFor(playlist)
        };

    playlistElem.addClass('loading');

    $.post(url, params, function(data, textStatus) {
        if (textStatus === 'success') {
            playlist.remoteID = data;
            playlistElem.removeClass('loading');
            playlistElem.addClass('youtube');
        } else {
            alert('Problem creating playlist on YouTube');
        }
    });
}

function updateRemotePlaylist(playlist, playlistElem) {
    var url = '/playlists/' + playlist.remoteID,
        params = {
            title: playlist.title,
            videos: getSimpleVideoListFor(playlist)
        };

    $.post(url, params, function(data, textStatus) {
        alert(data);
        if (textStatus === 'success') {
            playlistElem.removeClass('loading');
        } else {
            alert('Problem updating YouTube playlist');
        }
    });
}

function loadYouTubePlaylists(callback) {
    var remoteIDs = {};
    $.each(JSON.parse(localStorage.playlists || '[]'), function(i, item) {
        if (item.remoteID !== null) {
            remoteIDs[item.remoteID] = item;
        }
    });
    $.getJSON('/playlists', {}, function(data) {

        $.each(data.feed.entry, function(i, item) {
            var title = item['title']['$t'],
                remoteID = item['yt$playlistId']['$t'],
                isPrivate = 'yt$private' in item;

            if (!(remoteID in remoteIDs)) {
                createNewPlaylistInLocalStorage(title, [], remoteID, isPrivate);
            }
        });

        callback();

    });
}
