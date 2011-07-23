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
                this.playlists.push(new Playlist(item.title, item.videos, item.remoteID, item.isPrivate, item.shuffle));
            }
        } catch (e) {
            alert('Error parsing playlists from localStorage: ' + e); 
        }
    }
    this.load();

    /**
     * Download YouTube entries and create entries for them in localStorage if
     * they don't already exist.
     *
     * @param callback The function to be called when done.
     */
    this.loadYouTubePlaylists = function(callback) {
        var remoteIDs = {};
        $.each(this.playlists, function(i, item) {
            if (item.remoteID !== null) {
                remoteIDs[item.remoteID] = item;
            }
        });

        var home = this;

        $.getJSON('/playlists', {}, function(data) {
            $.each(data.feed.entry, function(i, item) {
                var title = item['title']['$t'],
                    remoteID = item['yt$playlistId']['$t'],
                    isPrivate = 'yt$private' in item;

                if (!(remoteID in remoteIDs)) {
                    home.addPlaylist(new Playlist(title, [], remoteID, isPrivate));
                }
            });
            home.save();
            callback();
        });
    };

    /**
     * Will save the current state when as soon as no other process tries to
     */
    this.save = function() {
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
    };

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
