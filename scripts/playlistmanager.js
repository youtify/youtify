function PlaylistsManager() {
    this.playlists = [];

    this.load = function() {
        var data,
            item,
            i;

        try {
            data = JSON.parse(localStorage['playlists'] || '[]');
            for (i = 0; i < data.length; i += 1) {
                item = data[i];
                if (item.remoteId) {
                    continue;
                }
                this.playlists.push(new Playlist(item.title, item.videos, item.remoteId, item.owner, item.isPrivate, item.shuffle));
            }
        } catch (e) {
            alert('Error parsing playlists from localStorage: ' + e); 
        }
    }
    this.load();

    this.removeRemotePlaylistsFromLocalStorage = function() {
        var localPlaylists = [];

        $.each(this.playlists, function(i, playlist) {
            if (!playlist.remoteId) {
                localPlaylists.push(playlist);
            }
        });

        this.playlists = localPlaylists;
        this.saveToLocalStorage();
    };

    this.getPlaylistsMap = function() {
        var ret = {};
        $.each(this.playlists, function(i, item) {
            if (item.remoteId !== null) {
                ret[item.remoteId] = item;
            }
        });
        return ret;
    }

    /**
     * Download stored playlists and place them in localStorage if
     * they don't already exist.
     *
     * @param callback The function to be called when done.
     */
    this.pull = function(callback) {
        var self = this,
            remoteIds = this.getPlaylistsMap();

        $.getJSON('/api/playlists', {}, function(data) {
            $.each(data, function(i, item) {
                var title = item['title'],
                    videos = item['videos'],
                    remoteId = item['remoteId'],
                    owner = item['owner'],
                    isPrivate = false,
                    shuffle = false;

                if (!(remoteId in remoteIds)) {
                    self.addPlaylist(new Playlist(title, videos, remoteId, owner, isPrivate));
                }
            });
            self.saveToLocalStorage();
            callback();
        });
    };

    this.save = function() {
        this.saveToLocalStorage();
        if (logged_in && this.playlists.length) {
            this.syncPlaylists(0);
        }
    };

    /**
     * Will save the current state when as soon as no other process tries to
     */
    this.saveToLocalStorage = function() {
        var startTime = new Date().getTime(),
            currentTime,
            timeDelta;

        while (this.locked) {
            currentTime = new Date().getTime();
            timeDelta = currentTime - startTime;
            if (timeDelta > 10000) {
                alert('Error: save function timed out.');
                return;
            }
            continue;
        }
        this.locked = true;

        try {
            localStorage['playlists'] = JSON.stringify(this.playlists);
        } catch(e) {
            alert('Error saving playlists: ' + e);
        }
        this.locked = false;
    }

    /**
     * Sync playlists sequentially with server.
     *
     * Will save back to localStorage when done (remoteIds may have been set).
     */
    this.syncPlaylists = function(i) {
        if (i >= this.playlists.length) {
            this.saveToLocalStorage();
            return;
        }

        var playlist = this.playlists[i],
            self = this;

        if (playlist.remoteId) {
            playlist.sync(function() {
                self.syncPlaylists(i + 1);
            });
        } else {
            self.syncPlaylists(i + 1);
        }
    }

    this.addPlaylist = function(playlist) {
        if (typeof playlist !== 'object') {
            throw "playlist param must be object";
        }
        this.playlists.push(playlist);
    };

    this.getPlaylist = function(index) {
        if ((index > this.playlists.length - 1) || (index < 0)) {
            throw "No playlist at index " + index;
        }
        return this.playlists[index];
    };

    this.setPlaylist = function(index, playlist) {
        if (typeof playlist !== 'object') {
            throw "playlist param must be object";
        }
        if ((index > this.playlists.length - 1) || (index < 0)) {
            throw "No playlist at index " + index;
        }
        this.playlists[index] = playlist;
    };

    this.movePlaylist = function(sourceIndex, destIndex) {
        if (destIndex > sourceIndex) {
            destIndex -= 1;
        }
        var tmp = this.playlists.splice(sourceIndex, 1)[0];
        this.playlists.splice(destIndex, 0, tmp);
    };

    this.deletePlaylist = function(index) {
        if (logged_in && this.playlists[index].remoteId) {
            this.playlists[index].unsync();
        }

        this.playlists.splice(index, 1);
    };
}

var playlistManager = new PlaylistsManager();
