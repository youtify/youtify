/*global

$: true,
playlistManager: true,
loadPlaylistView: true,

*/

/** EVENTS
 ****************************************************************************/

function deleteVideoButtonClicked(li) {
    var playlist = $('#playlistbar').data('playlist');
    var allSelectedVideos = li.parent().find('.video.selected');

    $.each(allSelectedVideos, function(index, li) {
        li = $(li);
        playlist.deleteVideo(li.index());
        li.remove();
    });

    playlistManager.save();
}

function playlistMouseDown(event) {
	$('#left-menu li').removeClass('selected');
	$(this).addClass('selected');
}

function loadPlaylist(playlistId) {
    $.ajax({
        url: '/api/playlists/' + playlistId,
        type: 'GET',
        statusCode: {
            200: function(data) {
                var playlist = new Playlist(data.title, data.videos, data.remoteId, data.owner, data.isPrivate);
                playlist.createViews();
                loadPlaylistView(playlist);
            },
            404: function(data) {
                alert("No such playlist found");
            }
        }
    });
}

function savePlaylistButtonClicked(event) {
    var playlist = $('#right .playlists .pane.active').data('model');
    playlistManager.addPlaylist(playlist.copy()); // create copy without connection to remote
    updatePlaylistBar(playlist);
    playlist.createViews();
}

function syncPlaylistButtonClicked(event) {
    var playlist = $('#right .playlists .pane.active').data('model');
    playlist.sync(function() {
        updatePlaylistBar(playlist);
        history.pushState(null, null, playlist.getUrl());
    });
}

function showPlaylistSharePopup(playlist, elem, arrowDirection) {
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
}

function shareButtonClicked(event) {
    var playlistBar = $(this).parent();
    var playlist = playlistBar.data('playlist');
    showPlaylistSharePopup(playlist, $(this), 'up');
}

function updatePlaylistBar(playlist) {
    $('#right .playlists .info .title').text(playlist.title);
    $('#right .playlists .info .owner').hide();
    $('#right .playlists .info .subscribe').hide();
    $('#right .playlists .info .copy').hide();
    $('#right .playlists .info .sync').hide();
    
    if (playlist.owner) {
        if (playlist.owner.id != my_user_id) { /* number != string */
            $('#right .playlists .info .owner').text(playlist.owner.name).show();

            // Add save button if not already saved
            if (!playlistManager.getPlaylistsMap().hasOwnProperty(playlist.remoteId)) {
               $('#right .playlists .info .copy').show().click(savePlaylistButtonClicked);
            }
            $('#right .playlists .info .subscribe')
                .show()
                .unbind('click')
                .click(function() {
                    alert('not implemented');
                });
        }
    } else if (logged_in) {
        $('#right .playlists .info .sync')
            .show()
            .unbind('click')
            .click(syncPlaylistButtonClicked);
    }
}

function loadPlaylistView(playlist) {
    $('#right > div').hide();
    
	$('#right .playlists .pane').hide().removeClass('active');
    $('#left .menu li').removeClass('selected');
    
    playlist.playlistDOMHandle.addClass('active');
    playlist.leftMenuDOMHandle.addClass('selected');

    updatePlaylistBar(playlist);
    
    if (playlist.playlistDOMHandle.children('.video').length !== playlist.videos.length) {
        playlist.playlistDOMHandle.html('');
        $.each(playlist.videos, function(i, item) {
            if (item) {
                item.createListView().appendTo(playlist.playlistDOMHandle);
            }
        });
    }
	playlist.playlistDOMHandle.show();
    $('#right .playlists').show();
}

/**
 * Mark the playlistElem in the #left as selected, then
 * fill #playlist with the contained videos.
 */
function playlistClicked(event) {
    var playlist = $(this).data('model');

    if (playlist.remoteId) {
        history.pushState(null, null, playlist.getUrl());
    } else {
        history.pushState(null, null, '/');
    }

    loadPlaylistView(playlist);
}

function shuffleButtonClicked(event) {
	var playlist = $('#playlistbar').data('playlist');

    if ($(this).hasClass('shuffle-on')) {
        playlist.shuffle = false;
        $(this).addClass('shuffle-off');
        $(this).removeClass('shuffle-on');
        Player.addSiblingsToPlayorder($('#results-container li.playing, #results-container li.paused'), false);
    } else {
        playlist.shuffle = true;
        $(this).addClass('shuffle-on');
        $(this).removeClass('shuffle-off');
        Player.addSiblingsToPlayorder($('#results-container li.playing, #results-container li.paused'), true);
    }

	playlistManager.save();
    event.stopPropagation();
}

/** CLASS PLAYLIST
 ****************************************************************************/

function Playlist(title, videos, remoteId, owner, isPrivate, shuffle) {
    this.title = title;
    this.videos = [];
    for (var i = 0; i < videos.length; i++) {
        if (videos[i]) {
            var video = new Video(videos[i].videoId, videos[i].title, videos[i].type, videos[i].rating);
            this.videos.push(video);
        }
    }
    this.remoteId = remoteId || null;
    this.isPrivate = isPrivate || false;
    this.shuffle = shuffle;
    this.owner = owner;
    this.synced = true; // not part of JSON structure
    this.syncing = false; // not part of JSON structure
    this.leftMenuDOMHandle = null;
    this.playlistDOMHandle = null;

    this.getTwitterShareUrl = function() {
        var url = this.getUrl(),
            text = "Check out this playlist!" + ' -- ' + this.title;
        return encodeURI('http://twitter.com/share?related=youtify&via=youtify' + '&url=' + url + '&counturl=' + url + '&text=' + text);
    };

    this.getFacebookShareUrl = function() {
        var url = this.getUrl();
        return 'http://facebook.com/sharer.php?u=' + url;
    };

    this.getUrl = function() {
        return location.protocol + '//' + location.host + '/users/' + this.owner.id + '/playlists/' + this.remoteId;
    };

    this.copy = function() {
        return new Playlist(this.title, this.videos);
    };

    this.rename = function(newTitle) {
        var title = $.trim(newTitle);
        if (title.length > 0 && title.length < 50) {
            this.title = newTitle;
        }
        this.synced = false;
        if (this.leftMenuDOMHandle) {
            this.leftMenuDOMHandle.find('.title').text(newTitle);
        }
    };

    this.unsync = function(callback) {
        $.ajax({
            type: 'DELETE',
            url: '/api/playlists/' + this.remoteId,
			statusCode: {
				200: function(data) {
					if (callback) {
						callback();
					}
				},
				404: function(data) {
					Notification.warn(translations['No such playlist found']);
				},
				409: function(data) {
					Notification.error(translations['Your account has been used somewhere else. Please reload the page.']);
				}
			}
        });

        this.remoteId = null;
        this.owner = null;
    };

    this.createNewPlaylistOnRemote = function(callback) {
        var self = this,
            params = {
                'json': JSON.stringify(this.toJSON()),
				'device': device
            };

        this.syncing = true;

		$.ajax({
            type: 'POST',
            url: '/api/playlists',
			data: params,
			statusCode: {
				200: function(data, textStatus) {
					self.syncing = false;
					if (textStatus === 'success') {
						self.remoteId = data.remoteId;
						self.owner = data.owner;
						self.synced = true;
					 } else {
						alert('Failed to create new playlist ' + self.title);
					}
					if (callback) {
						callback();
					}
				},
				409: function(data) {
					Notification.error(translations['Your account has been used somewhere else. Please reload the page.']);
				}
			}
        });
    };

    this.updatePlaylistOnRemote = function(callback) {
        var self = this,
            params = {
                'json': JSON.stringify(this.toJSON()),
				'device': device
            };

        this.syncing = true;

		$.ajax({
            type: 'POST',
            url: '/api/playlists/' + this.remoteId,
			data: params,
			statusCode: {
				200: function(data, textStatus) {
					self.syncing = false;
					if (textStatus === 'success') {
						self.synced = true;
					} else {
						alert('Failed to create new playlist ' + self.title);
					}
					if (callback) {
						callback();
					}
				},
				404: function(data) {
					Notification.warn(translations['No such playlist found']);
				},
				409: function(data) {
					Notification.error(translations['Your account has been used somewhere else. Please reload the page.']);
				}
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

    this.addVideo = function(video) {
        if (this.syncing) {
            alert("Please wait until the playlist is synced");
            return;
        }

        var newVideo = video.clone();
        this.videos.push(newVideo);
        
        newVideo.createListView().appendTo(this.playlistDOMHandle);
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
            owner: this.owner,
            isPrivate: this.isPrivate,
			shuffle: this.shuffle
        };
    };

    this.createViews = function() {
        var self = this,
            table = $('<table/>')
                .addClass('pane')
                .appendTo('#right .playlists')
                .data('model', self),
            li = $('<li/>')
                .addClass("playlistElem")
                .addClass('droppable')
                .data('model', self)
                .bind('contextmenu', showPlaylistContextMenu)
                .mousedown(playlistMouseDown)
                .click(playlistClicked);

        $('<span class="title"></span>').text(this.title).appendTo(li);

        if (this.remoteId) {
            li.addClass('remote');
        } else {
            li.addClass('local');
        }

        if (this.isPrivate) {
            li.addClass('private');
        }
        li.appendTo('#left .playlists ul');
        this.leftMenuDOMHandle = li;
        this.playlistDOMHandle = table;
    };
	
	this.removeDuplicates = function() {
		var deleted = 0,
            i, j;
		for (i = this.videos.length-1; i > 0; i -= 1) {
			for (j = i-1; j >= 0; j -= 1) {
				if (this.videos[i].videoId === this.videos[j].videoId) {
					this.deleteVideo(j);
					deleted += 1;
					break;
				}
			}
		}
		playlistManager.save();
		loadPlaylistView(this);
		return deleted;
	};
}
