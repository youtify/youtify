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

    /**
     * Download stored playlists and place them in localStorage if
     * they don't already exist.
     *
     * @param callback The function to be called when done.
     */
    this.pull = function(callback) {
        var remoteIds = {};
        $.each(this.playlists, function(i, item) {
            if (item.remoteId !== null) {
                remoteIds[item.remoteId] = item;
            }
        });

        var home = this;

        $.getJSON('/playlists', {}, function(data) {
            $.each(data, function(i, item) {
                var title = item['title'],
                    remoteId = item['remoteId'],
                    isPrivate = false,
                    shuffle = false;

                if (!(remoteId in remoteIds)) {
                    home.addPlaylist(new Playlist(title, [], remoteId, isPrivate));
                }
            });
            home.save();
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
            return;
            this.saveToLocalStorage();
        }

        var params = {},
            self = this,
            playlist = this.playlists[i];

        if (playlist.remoteId === null) {
            params = {
                'title': playlist.title,
                'videos': JSON.stringify(playlist.videos)
            };
            $.post('/playlists', params, function(data, textStatus) {
                if (textStatus === 'success') {
                    playlist.remoteId = data;
                } else {
                    alert('Failed to create new playlist ' + playlist.title);
                }
                self.pushPlaylists(i + 1);
            });
        } else {
            // @todo update/sync existing playlist
            self.pushPlaylists(i + 1);
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
        this.playlists.splice(index, 1);
    };
}

var playlistManager = new PlaylistsManager();
