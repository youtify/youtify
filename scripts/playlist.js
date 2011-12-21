/*global

$: true,
playlistManager: true,
loadPlaylistView: true,

*/

/** EVENTS
 ****************************************************************************/

function deleteVideoButtonClicked(li) {
    var playlist = playlistManager.getCurrentlySelectedPlaylist();
    var allSelectedVideos = li.parent().find('.video.selected');

    $.each(allSelectedVideos, function(index, item) {
        $video = $(item);
        playlist.deleteVideo($video.index());
        $video.remove();
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
}

function syncPlaylistButtonClicked(event) {
    var playlist = playlistManager.getCurrentlySelectedPlaylist();
    console.log('syncing playlist ' + playlist.title);
    playlist.sync(function() {
        updatePlaylistBar(playlist);
        playlistManager.save();
        playlist.getMenuView().addClass('remote');
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
    var $playlistBar = $('#right > .playlists .info');
    $playlistBar.data('model', playlist);
    $playlistBar.find('.title').text(playlist.title);
    $playlistBar.find('.owner').hide();
    $playlistBar.find('.copy').hide().unbind('click');
    $playlistBar.find('.sync').hide().unbind('click');
    
    if (playlist.owner) {
        if (my_user_id === '' || playlist.owner.id !== parseInt(my_user_id, 10)) {
            $playlistBar.find('.owner').text(playlist.owner.name).show();

            // Add save button if not already saved
            if (!playlistManager.getPlaylistsMap().hasOwnProperty(playlist.remoteId)) {
               $playlistBar.find('.copy').show().one('click', savePlaylistButtonClicked);
            }
        }
    } else if (logged_in) {
        $playlistBar.find('.sync').show().one('click', syncPlaylistButtonClicked);
    }
}

function loadPlaylistView(playlist) {
    $('#right > div').hide();
    
	$('#right > .playlists .pane').hide().removeClass('active');
    $('#left .menu li').removeClass('selected');
    
    playlist.playlistDOMHandle.addClass('active');
    playlist.leftMenuDOMHandle.addClass('selected');

    updatePlaylistBar(playlist);
    
    if (playlist.playlistDOMHandle.find('.video').length !== playlist.videos.length) {
        playlist.playlistDOMHandle.html('');
        $.each(playlist.videos, function(i, item) {
            if (item) {
                $video = item.createListView();
                $video.data('additionalMenuButtons', [{
                    title: 'Delete',
                    args: $video,
                    callback: deleteVideoButtonClicked
                }]);
                $video.addClass('droppable');
                $video.addClass('draggable');
                $video.addClass('reorderable');
                $video.appendTo(playlist.playlistDOMHandle);
            }
        });
    }
	playlist.playlistDOMHandle.show();
    $('#right > .playlists').show();
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

/** CLASS PLAYLIST
 ****************************************************************************/

function Playlist(title, videos, remoteId, owner, isPrivate) {
    var i;
    this.title = title;
    this.videos = [];
    for (i = 0; i < videos.length; i+= 1) {
        if (videos[i]) {
            var video = new Video(videos[i].videoId, videos[i].title, videos[i].type, videos[i].rating);
            this.videos.push(video);
        }
    }
    this.remoteId = remoteId || null;
    this.isPrivate = isPrivate || false;
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

    this.getMenuView = function() {
        if (this.leftMenuDOMHandle === null) {
            this.createViews();
        }
        return this.leftMenuDOMHandle;
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

        var $video = newVideo.createListView();
        $video.data('additionalMenuButtons', [{
            title: 'Delete',
            args: $video,
            callback: deleteVideoButtonClicked
        }]);
        $video.addClass('droppable');
        $video.addClass('draggable');
        $video.addClass('reorderable');
        $video.appendTo(this.playlistDOMHandle);

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
            isPrivate: this.isPrivate
        };
    };

    this.createViews = function() {
        var self = this,
            table = $('<table/>')
                .addClass('pane')
                .appendTo('#right > .playlists')
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
