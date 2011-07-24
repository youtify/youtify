/** EVENTS
 ****************************************************************************/

function deleteVideoButtonClicked(li) {
    var playlistElem = $('.playlistElem.selected'),
        playlist = playlistElem.data('model');

    playlist.deleteVideo(li.index());
    playlistManager.save();
    playlistElem.click(); // reload playlist
}

function playlistMouseDown(event) {
	$('#left-menu li').removeClass('selected');
	$(this).addClass('selected');
}

/**
 * Mark the playlistElem in the #left-menu as selected, then
 * fill #playlist with the contained videos.
 */
function playlistClicked(event) {
    $('#playlist').html('');

	$('#results-container ol').hide();
	$('#playlist').show();
	$('#playlist').data('owner', $(this));

    var playlist = $(this).data('model');

    $.each(playlist.videos, function(i, item) {
        var li = createResultsItem(item.title, item.videoId);
        li.data('additionalMenuButtons').push({
            title: 'Delete',
            li: li,
            callback: deleteVideoButtonClicked
        });
        li.addClass('droppable');
        li.addClass('draggable');
        li.addClass('reorderable');
        li.appendTo('#playlist');
    });
}

function shuffleButtonClicked(event) {
    if ($(this).hasClass('shuffle-on')) {
        setShuffle(false, $(this).parent());
        Player.addSiblingsToPlayorder($('#results-container li.playing, #results-container li.paused'), false);
    } else {
        setShuffle(true, $(this).parent());
        Player.addSiblingsToPlayorder($('#results-container li.playing, #results-container li.paused'), true);
    }
    event.stopPropagation();
}

/** MISC
 ****************************************************************************/

function setShuffle(enabled, playlistElem) {
	var playlist = playlistElem.data('model');
	playlist.shuffle = enabled;
	playlistManager.save();
	if (enabled) {
		$(playlistElem).find('.shuffle-off').addClass('shuffle-on');
		$(playlistElem).find('.shuffle-off').removeClass('shuffle-off');
	} else {
		$(playlistElem).find('.shuffle-on').addClass('shuffle-off');
		$(playlistElem).find('.shuffle-on').removeClass('shuffle-on');
	}
}

function getVidsInPrivatePlaylist(playlistId, callback, start, feed) {
    if (start === undefined) {
        start = 1;
    }
    if (feed === undefined) {
        feed = [];
    }

    var url = '/playlists/' + playlistId,
        params = {
            'start-index': start
        };

    $.getJSON(url, params, function(data) {
        if (data.feed.entry && data.feed.entry.length > 0) {
			feed = $.merge(feed, data.feed.entry);
            getVidsInPrivatePlaylist(playlistId, callback, start+50, feed);
        } else {
            callback(feed);
        }
    });
}

/** CLASS PLAYLIST
 ****************************************************************************/

function Playlist(title, videos, remoteId, isPrivate, shuffle) {
    this.title = title;
    this.videos = videos;
    this.remoteId = remoteId || null;
    this.isPrivate = isPrivate || false;
    this.shuffle = shuffle;

    this.rename = function(newTitle) {
        var title = $.trim(newTitle);
        if (title.length > 0 && title.length < 50) {
            this.title = newTitle;
        }
    };

    this.addVideo = function(title, videoId) {
        if (typeof title !== 'string') {
            throw "title param must be string";
        }
        if (typeof videoId !== 'string') {
            throw "videoId param must be string";
        }

        this.videos.push({
            videoId: videoId,
            title: title,
        });
    };

    this.moveVideo = function(sourceIndex, destIndex) {
        var tmp;

        if (destIndex > sourceIndex) {
            destIndex -= 1;
        }

        tmp = this.videos.splice(sourceIndex, 1)[0];
        this.videos.splice(destIndex, 0, tmp);
    };

    this.deleteVideo = function(index) {
        this.videos.splice(index, 1);
    };

    this.sync = function(playlistElem) {
        if (this.remoteID === null) {
            this.push(playlistElem);
            return;
        }

        //this.updateRemotePlaylist(playlistElem);
        
        var home = this;

        if (this.isPrivate) {
            playlistElem.addClass('loading');
            getVidsInPrivatePlaylist(remoteID, function (vids) {
                playlistElem.removeClass('loading');
                $.each(vids, function(i, item) {
                    var videoId = item['media$group']['yt$videoid']['$t'],
                        title = item['title']['$t'];

                    home.videos.push({
                        videoId: videoId,
                        title: title,
                    });
                });
                playlistManager.save();
            });
        } else {
            getVidsInPlaylist(remoteID, function(vids) {
                $.each(vids, function(i, item) {
                    var videoId = item['media$group']['yt$videoid']['$t'],
                        title = item['title']['$t'];

                    home.videos.push({
                        videoId: videoId,
                        title: title,
                    });
                });
                playlistManager.save();
            }, {'playlist': playlistElem});
        }
    };

    this.makeCommaSeparatedVideoIdString = function() {
        var ret = '';
        $.each(this.videos, function(i, video) {
            if (ret.length) {
                ret += ',';
            }
            ret += video.videoId;
        });
        return ret;
    };

    /**
     * Create new playlist on remote.
     */
    this.push = function(playlistElem) {
        var url = '/playlists',
            params = {
                title: playlist.title,
                videos: this.makeCommaSeparatedVideoIdString()
            };

        playlistElem.addClass('loading');

        $.post(url, params, function(data, textStatus) {
            if (textStatus === 'success') {
                playlist.remoteId = data;
                playlistElem.removeClass('loading');
                playlistElem.addClass('youtube');
            } else {
                alert('problem creating playlist on YouTube');
            }
        });
    };

    /**
     * Sync title and videos from this playlist to * remote playlist.
     */
    function updateRemotePlaylist(playlistElem) {
        var url = '/playlists/' + playlist.remoteID,
            params = {
                title: this.title,
                videos: this.makeCommaSeparatedVideoIdString(),
            };

        $.post(url, params, function(data, textStatus) {
            if (textStatus === 'success') {
                playlistElem.removeClass('loading');
            } else {
                alert('problem updating YouTube playlist');
            }
        });
    };

    this.toJSON = function() {
        return {
            title: this.title,
            videos: this.videos,
            remoteId: this.remoteId,
            isPrivate: this.isPrivate,
			shuffle: this.shuffle
        };
    };

    this.createListElem = function() {
        var li = $('<li/>')
            .addClass("playlistElem")
            .addClass('droppable')
            .addClass('draggable')
            .addClass('reorderable')
            .data('model', this)
            .text(this.title)
            .bind('contextmenu', showPlaylistContextMenu)
            .mousedown(playlistMouseDown)
            .click(playlistClicked);

        if (this.remoteId) {
            li.addClass('youtube');
        } else {
            li.addClass('local')
        }

        if (this.isPrivate) {
            li.addClass('private');
        }

        var shuffleButton = $('<button/>').click(shuffleButtonClicked);

        if (this.shuffle) {
            shuffleButton.addClass('shuffle-on');
        } else {
            shuffleButton.addClass('shuffle-off');
        }

        shuffleButton.appendTo(li);
        
        return li;
    };
};
