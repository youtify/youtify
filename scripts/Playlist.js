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
    var i, 
        self = this;
    self.title = title;
    self.videos = [];
    /* The loop that adds videos to self.videos is moved to the end of the class to avoid reference errors */
    self.remoteId = remoteId || null;
    self.isPrivate = isPrivate || false;
    self.owner = owner;
    self.synced = true; // not part of JSON structure
    self.syncing = false; // not part of JSON structure
    self.leftMenuDOMHandle = null;
    self.playlistDOMHandle = null;

    self.getTwitterShareUrl = function() {
        var url = self.getUrl(),
            text = "Check out self playlist!" + ' -- ' + self.title;
        return encodeURI('http://twitter.com/share?related=youtify&via=youtify' + '&url=' + url + '&counturl=' + url + '&text=' + text);
    };

    self.getFacebookShareUrl = function() {
        var url = self.getUrl();
        return 'http://facebook.com/sharer.php?u=' + url;
    };

    self.getUrl = function() {
        return location.protocol + '//' + location.host + '/users/' + self.owner.id + '/playlists/' + self.remoteId;
    };

    self.copy = function() {
        return new Playlist(self.title, self.videos);
    };

    self.getMenuView = function() {
        if (self.leftMenuDOMHandle === null) {
            self.createViews();
        }
        return self.leftMenuDOMHandle;
    };
    
    self.setAsPlaying = function() {
        $('#left .menu li').removeClass('playing');
        self.getMenuView().addClass('playing');
    };

    self.rename = function(newTitle) {
        var title = $.trim(newTitle);
        if (title.length > 0 && title.length < 50) {
            self.title = newTitle;
        }
        self.synced = false;
        if (self.leftMenuDOMHandle) {
            self.leftMenuDOMHandle.find('.title').text(newTitle);
        }
    };

    self.unsync = function(callback) {
        $.ajax({
            type: 'DELETE',
            url: '/api/playlists/' + self.remoteId,
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
                    new ReloadDialog().show();
				}
			}
        });

        self.remoteId = null;
        self.owner = null;
    };

    self.createNewPlaylistOnRemote = function(callback) {
        var params = {
                'json': JSON.stringify(self.toJSON()),
				'device': device
            };

        self.syncing = true;

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
                    new ReloadDialog().show();
				}
			}
        });
    };

    self.updatePlaylistOnRemote = function(callback) {
        var params = {
                'json': JSON.stringify(self.toJSON()),
				'device': device
            };

        self.syncing = true;

		$.ajax({
            type: 'POST',
            url: '/api/playlists/' + self.remoteId,
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
                    new ReloadDialog().show();
				}
			}
        });
    };

    self.sync = function(callback) {
        if (self.remoteId && self.synced) {
            callback();
        } else if (self.remoteId) {
            self.updatePlaylistOnRemote(callback);
        } else {
            self.createNewPlaylistOnRemote(callback);
        }
    };

    self.addVideo = function(video) {
        if (self.syncing) {
            alert("Please wait until the playlist is synced");
            return;
        }

        var newVideo = video.clone();
        newVideo.onPlayCallback = self.setAsPlaying;
        self.videos.push(newVideo);

        var $video = newVideo.createListView();
        $video.data('additionalMenuButtons', [{
            title: 'Delete',
            args: $video,
            callback: deleteVideoButtonClicked
        }]);
        $video.addClass('droppable');
        $video.addClass('draggable');
        $video.addClass('reorderable');
        $video.appendTo(self.playlistDOMHandle);

        self.synced = false;
    };

    self.moveVideo = function(sourceIndex, destIndex) {
        if (self.syncing) {
            alert("Please wait until the playlist is synced");
            return;
        }

        var tmp;

        if (destIndex > sourceIndex) {
            destIndex -= 1;
        }

        tmp = self.videos.splice(sourceIndex, 1)[0];
        self.videos.splice(destIndex, 0, tmp);

        self.synced = false;
    };

    self.deleteVideo = function(index) {
        if (self.syncing) {
            alert("Please wait until the playlist is synced");
            return;
        }

        self.videos.splice(index, 1);
        self.synced = false;
    };

    self.toJSON = function() {
        return {
            title: self.title,
            videos: self.videos,
            remoteId: self.remoteId,
            owner: self.owner,
            isPrivate: self.isPrivate
        };
    };

    self.createViews = function() {
        var table = $('<table/>')
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

        $('<span class="title"></span>').text(self.title).appendTo(li);

        if (self.remoteId) {
            li.addClass('remote');
        } else {
            li.addClass('local');
        }

        if (self.isPrivate) {
            li.addClass('private');
        }
        self.leftMenuDOMHandle = li;
        self.playlistDOMHandle = table;
    };
	
	self.removeDuplicates = function() {
		var deleted = 0,
            i, j;
		for (i = self.videos.length-1; i > 0; i -= 1) {
			for (j = i-1; j >= 0; j -= 1) {
				if (self.videos[i].videoId === self.videos[j].videoId) {
					self.deleteVideo(j);
					deleted += 1;
					break;
				}
			}
		}
		playlistManager.save();
		loadPlaylistView(self);
		return deleted;
	};
    
    for (i = 0; i < videos.length; i+= 1) {
        if (videos[i]) {
            var video = new Video({
                videoId: videos[i].videoId,
                title: videos[i].title,
                type: videos[i].type,
                duration: videos[i].duration,
                onPlayCallback: self.setAsPlaying
            });
            self.videos.push(video);
        }
    }
}
