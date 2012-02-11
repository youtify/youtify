function extractArtist(title) {
    if (title) {
        var parts = title.split('-');
        if (parts.length > 1) {
            return $.trim(parts[0]);
        }
    }
    return false;
}

/**
 * @todo: remove clumsy logic in this function when we have a reliable way
 * of getting the currently playing playlist.
 */
function renameCurrentlyPlayingVideo(title) {
    var video = $('.video.playing'),
        playlist,
        videoModel;

    if (video) {
        playlist = video.parent().data('model');
    }

    video.find('.title').text(title);

    if (playlist) {
        videoModel = playlist.videos[video.index()];
        videoModel.title = title;
        playlistManager.save();
    }
}
