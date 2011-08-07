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

function loadPlaylistView(playlist) {
	$('#results-container ol').hide();
    $('#playlist').html('');
	$('#playlist').show();

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

/**
 * Mark the playlistElem in the #left-menu as selected, then
 * fill #playlist with the contained videos.
 */
function playlistClicked(event) {
    var playlist = $(this).data('model');

    if (playlist.remoteId) {
        history.pushState(null, null, '/playlists/' + playlist.remoteId);
    }

	$('#playlist').data('owner', $(this));

    loadPlaylistView(playlist);
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

/** CLASS PLAYLIST
 ****************************************************************************/

function Playlist(title, videos, remoteId, isPrivate, shuffle) {
    this.title = title;
    this.videos = videos;
    this.remoteId = remoteId || null;
    this.isPrivate = isPrivate || false;
    this.shuffle = shuffle;
    this.synced = true; // not part of JSON structure
    this.syncing = false; // not part of JSON structure

    this.rename = function(newTitle) {
        var title = $.trim(newTitle);
        if (title.length > 0 && title.length < 50) {
            this.title = newTitle;
        }
        this.synced = false;
    };

    this.unsync = function(callback) {
        $.ajax({
            type: 'DELETE',
            url: '/api/playlists/' + this.remoteId,
            success: function() {
                if (callback) {
                    callback();
                }
            }
        });

        this.remoteId = null;
    };

    this.createNewPlaylistOnRemote = function(callback) {
        var self = this,
            params = {
                'json': JSON.stringify(this.toJSON())
            };

        this.syncing = true;

        $.post('/api/playlists', params, function(data, textStatus) {
            self.syncing = false;
            if (textStatus === 'success') {
                self.remoteId = data;
                self.synced = true;
            } else {
                alert('Failed to create new playlist ' + self.title);
            }
            if (callback) {
                callback();
            }
        });
    };

    this.updatePlaylistOnRemote = function(callback) {
        var self = this,
            params = {
                'json': JSON.stringify(this.toJSON())
            };

        this.syncing = true;

        $.post('/api/playlists/' + this.remoteId, params, function(data, textStatus) {
            self.syncing = false;
            if (textStatus === 'success') {
                self.synced = true;
            } else {
                alert('Failed to update playlist ' + self.title);
            }
            if (callback) {
                callback();
            }
        });
    };

    this.sync = function(callback) {
        if (this.remoteId && this.synced) {
            callback();
        } else if (this.remoteId) {
            this.updatePlaylistOnRemote(callback);
        } else {
            this.createNewPlaylistOnRemote(callback);
        }
    };

    this.addVideo = function(title, videoId) {
        if (this.syncing) {
            alert("Please wait until the playlist is synced");
            return;
        }

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

        this.synced = false;
    };

    this.moveVideo = function(sourceIndex, destIndex) {
        if (this.syncing) {
            alert("Please wait until the playlist is synced");
            return;
        }

        var tmp;

        if (destIndex > sourceIndex) {
            destIndex -= 1;
        }

        tmp = this.videos.splice(sourceIndex, 1)[0];
        this.videos.splice(destIndex, 0, tmp);

        this.synced = false;
    };

    this.deleteVideo = function(index) {
        if (this.syncing) {
            alert("Please wait until the playlist is synced");
            return;
        }

        this.videos.splice(index, 1);
        this.synced = false;
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
            .bind('contextmenu', showPlaylistContextMenu)
            .mousedown(playlistMouseDown)
            .click(playlistClicked);

        $('<span class="title"></span>').text(this.title).appendTo(li);

        if (this.remoteId) {
            li.addClass('remote');
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
