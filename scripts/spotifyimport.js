function spotifyImport_Init() {
    $('#spotify-importer')
        .bind('contextmenu', function(event) {
            event.stopPropagation();
        })
        .click(function(event) {
            event.stopPropagation();
        });

    var importer = new SpotifyImporter();

    // cancel
    $('#spotify-importer .cancel').click(function() {
        importer.cancel();
        $('#spotify-importer').hide();
        $('#blocker, .arrow').remove();
    });

    // start
    $('#spotify-importer .start').click(function() {
        var li = $('#playlists .selected');
        var playlist = li.data('model');
        importer.start(
            $('#spotify-importer textarea').val(),
            playlist,
            function() {
                // callbackUpdate
                $('#spotify-importer .added').text(importer.added);
                $('#spotify-importer .max').text('/'+importer.max);
                loadPlaylistView(playlist);
            },
            function() {
                // callbackDone
                $('#spotify-importer').hide();
                $('#blocker').remove();
                loadPlaylistView(playlist);
            }
        );
    });
}

function SpotifyImporter() {
	this.wait = 200;
	this.longWait = 0;
	this.spotifyIds = [];
	this.added = 0;
	this.max = 0;
	this.callbackUpdate = null;
	this.callbackDone = null;
	this._cancel = false;
	
	this.cancel = function() {
		this._cancel = true;
	};

    function dummyFunction() {
    }

	this.start = function(str, playlist, callbackUpdate, callbackDone) {
		this.callbackUpdate = callbackUpdate || dummyFunction;
		this.callbackDone   = callbackDone || dummyFunction;
		this.added = 0;
		this.max = 0;
		this.spotifyIds = [];
		this._cancel = false;
			
		var self = this;
		var ids = $.trim(str).split('\n');
		
		$.each(ids, function(index, id) {
			id = $.trim(id).replace('http://open.spotify.com/track/', '').replace('spotify:track:', '');
			if (id.indexOf('open.spotify.com/local/') > 0 || id.indexOf('spotify:local') > 0) {
				// don't bother asking spotify for a local file
				id = $.trim(id).replace('http://open.spotify.com/local/', '').replace('spotify:local:', '');
				var tmpArray = id.split('/');
				if (tmpArray.length < 2) {
					tmpArray = id.split(':');
                }
				var artist = tmpArray[0];
				var title = tmpArray[2];
			
				self.max += 1;
				self.findAndAddToPlaylist(artist + ' - ' + title, playlist);
			} else if (id.length > 0) {
				self.spotifyIds.push(id);
				self.max += 1;
			}
		});
		
		this.addFromSpotifyToPlaylist(playlist);
	};
	
	this.addFromSpotifyToPlaylist = function(playlist) {
		if (this._cancel) {
			return;
        }
		var self = this;
		var id;
		if (this.spotifyIds.length > 0) {
			id = this.spotifyIds[0];
		} else {
			return;
		}

		var url = 'http://ws.spotify.com/lookup/1/.json?uri=spotify:track:'+id;
		
		$.getJSON(url, {}, function(data) {
			if (data !== undefined) {
				var q = data.track.name;
				if (data.track.artists.length > 0) {
					q = data.track.artists[0].name + ' - ' + data.track.name;
                }
			}
			self.findAndAddToPlaylist(q, playlist);
			
			self.spotifyIds.shift();
			self.longWait = 0;
			setTimeout(function() { self.addFromSpotifyToPlaylist(playlist); }, self.wait);
		})
		.error(function(jqXHR) {
			if (jqXHR.status === 404) { // UNKNOWN SONG
				self.spotifyIds.shift();
				setTimeout(function() { self.addFromSpotifyToPlaylist(playlist); }, self.wait);
			} else if (jqXHR.status === 0) { // LIMIT?
				self.longWait += 10000;
				self.wait *= 2;
				setTimeout(function() { self.addFromSpotifyToPlaylist(playlist); }, self.longWait);
			} else {
				console.log(jqXHR);
				alert(jqXHR.statusText);
			}
		});
	};
	
	this.findAndAddToPlaylist = function(q, playlist) {
		var self = this;
		var url = 'http://gdata.youtube.com/feeds/api/videos?callback=?';
		var params = {
			'alt': 'json-in-script',
			'max-results': 1,
			'start-index': 1,
			'format': 5,
			'q': q
		};

		$.getJSON(url, params, function(data) {
			if (data.feed.entry === undefined) {
				return;
			}
			
			$.each(data.feed.entry, function(i, item) {
				var url = item.id.$t;
				var videoId = url.match('videos/(.*)$')[1];
				var title = item.title.$t;
				playlist.addVideo(new Video(videoId, title, 'yt'));
				self.added += 1;
			});
			
			self.updatedPlaylist();
		});
	};
	
	this.updatedPlaylist = function() {
		if (this.spotifyIds.length > 0) {
			this.callbackUpdate();
		} else {
			playlistManager.save();
			this.callbackDone();
		}
	};
}

