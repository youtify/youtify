function PlaylistsManager() {
    this.playlists = [];

    this.load = function() {
        var data,
            item,
            i;

        try {
            if (logged_in) {
                data = JSON.parse(localStorage['loggedInPlaylists'] || '[]');
            } else {
                data = JSON.parse(localStorage['loggedOutPlaylists'] || '[]');
            }
            for (i = 0; i < data.length; i += 1) {
                item = data[i];
                this.playlists.push(new Playlist(item.title, item.videos, item.remoteId, item.isPrivate, item.shuffle));
            }
        } catch (e) {
            alert('Error parsing playlists from localStorage: ' + e); 
        }
    }
    this.load();

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

        $.getJSON('/playlists', {}, function(data) {
            $.each(data, function(i, item) {
                var title = item['title'],
                    videos = item['videos'],
                    remoteId = item['remoteId'],
                    isPrivate = false,
                    shuffle = false;

                if (!(remoteId in remoteIds)) {
                    self.addPlaylist(new Playlist(title, videos, remoteId, isPrivate));
                }
            });
            self.saveToLocalStorage();
            callback();
        });
    };

    this.save = function() {
        this.saveToLocalStorage();
        if (logged_in && this.playlists.length) {
            this.pushPlaylists(0);
        }
    };

    /**
     * Will save the current state when as soon as no other process tries to
     */
    this.saveToLocalStorage = function() {
        var startTime = new Date().getTime(),
            currentTime,
            timeDelta,
            self = this,
            key = logged_in ? 'loggedInPlaylists' : 'loggedOutPlaylists';

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
            localStorage[key] = JSON.stringify(this.playlists);
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
    this.pushPlaylists = function(i) {
        if (i >= this.playlists.length) {
            this.saveToLocalStorage();
            return;
        }

        var playlist = this.playlists[i],
            params = {
                'json': JSON.stringify(playlist.toJSON()),
            },
            self = this;

        if (playlist.remoteId) {
            $.post('/playlists/' + playlist.remoteId, params, function(data, textStatus) {
                if (textStatus === 'success') {
                    console.log(playlist.title + ' updated');
                } else {
                    alert('Failed to update playlist ' + playlist.title);
                }
                self.pushPlaylists(i + 1);
            });
        } else {
            $.post('/playlists', params, function(data, textStatus) {
                if (textStatus === 'success') {
                    console.log(playlist.title + ' = ' + data);
                    playlist.remoteId = data;
                } else {
                    alert('Failed to create new playlist ' + playlist.title);
                }
                self.pushPlaylists(i + 1);
            });
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
        var remoteId = this.playlists[index].remoteId;

        if (logged_in && remoteId) {
            $.ajax({
                type: 'DELETE',
                url: '/playlists/' + remoteId,
            });
        }

        this.playlists.splice(index, 1);
    };
}

var playlistManager = new PlaylistsManager();
