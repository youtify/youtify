var Toplist = {
    toplistMenuItem: null,
    popularPlaylistsTab: null,

    init: function() {
        this.toplistMenuItem = Menu.find('toplist');
        this.popularPlaylistsTab = this.toplistMenuItem.findTab('playlists-toplist');
    },

    loadPopularPlaylists: function() {
        self = this;
        self.popularPlaylistsTab.paneView.html('');
        LoadingBar.show();
        history.pushState(null, null, '/toplist/playlists');
        $.get('/api/toplists/playlists', function(playlists) {
            $.each(playlists, function(index, item) {
                var playlist = new Playlist(item.title, item.videos, item.remoteId, item.owner, item.isPrivate, item.followers);
                if (playlist.videos.length) {
                    self.popularPlaylistsTab.paneView.append(PlaylistView.createSmallPlaylistView(playlist, index));
                }
            });
            LoadingBar.hide();
        });
    }
};
