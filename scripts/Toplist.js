var Toplist = {
    toplistMenuItem: null,
    $rightView: null,

    init: function() {
        this.toplistMenuItem = Menu.find('toplist');
        this.$rightView = this.toplistMenuItem.rightView;
    },

    show: function() {
        self = this;
        self.$rightView.html('');
        LoadingBar.show();
        history.pushState(null, null, '/');
        $.get('/api/toplists/playlists', function(playlists) {
            $.each(playlists, function(index, item) {
                var playlist = new Playlist(item.title, item.videos, item.remoteId, item.owner, item.isPrivate, item.followers);
                if (playlist.videos.length) {
                    self.$rightView.append(PlaylistView.createSmallPlaylistView(playlist));
                }
            });
            LoadingBar.hide();
        });
    }
};
