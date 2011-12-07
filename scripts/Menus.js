var pendingVideo;

var Menus = {
    left: [],
    init: function() {
        /* Create new menus */
        Menus.left.push(new Menu('toplist').init());
        Menus.left.push(new Menu('queue').init());
        Menus.left.push(new Menu('search').init());
        
        /* Bind events */
        $('#left .playlists .new span').click(Menus.newPlaylistClick);
        $('#left .playlists .new input').keyup(Menus.newPlaylistNameKeyUp);
        $('#left .playlists .new input').blur(Menus.newPlaylistNameBlur);
    },
    createPlaylistViews: function() {
        $('#left .menu .playlists').html('');
        for (var i = 0; i < playlistManager.playlists.length; i += 1) {
            playlistManager.getPlaylist(i).createViews();
        }
    },
    newPlaylistClick: function() {
        var suggestedTitle = '',
            artist;
            
        /* Generate playlist name from dragged video */
        if (pendingVideo) {
            artist = extractArtist(pendingVideo.title);
            if (artist) {
                suggestedTitle = artist;
            }
        }
        
        /* Hide the label and show the text input */
        $(this).hide();
        $('#left .playlists .new input')
            .show()
            .focus()
            .select()
            .val(suggestedTitle);
    },
    newPlaylistNameBlur: function() {
        $('#left .playlists .new span').show();
        $(this).hide();
        pendingVideo = null;
    },
    newPlaylistNameKeyUp: function(event) {
        var title,
            playlist,
            videos = [];

        switch (event.keyCode) {
            case 13: // RETURN
                $('#left .playlists .new input').hide();
                $('#left .playlists .new span').show();

                title = $.trim($(this).val());
                if (title.length > 0 && title.length < 50) {
                    if (pendingVideo) {
                        videos.push(pendingVideo);
                    }
                    playlist = new Playlist($(this).val(), videos);
                    playlist.createViews();
                    playlistManager.addPlaylist(playlist);
                    if (logged_in) {
                        playlist.createNewPlaylistOnRemote(function() {
                            playlistManager.save();
                        });
                    } else {
                        playlistManager.save();
                    }
                } else {
                    return;
                }
                $(this).val('');
                pendingVideo = null;
                break;
            case 27: // ESC
                $('#left .playlists .new input').hide();
                $('#left .playlists .new span').show();
                $(this).val('');
                pendingVideo = null;
                break;
        }
        event.stopPropagation();
    }

};

function Menu(type) {
    var self = this;
    var type = type;
    var leftView = null;
    var rightView = null;
    
    var init = function() {
        /* Set click event */
        self.leftView.click(self.select);
        /* Bind views */
        switch(self.type) {
            case 'toplist':
                self.leftView = $('#left .menu .toplist');
                self.rightView = $('#right .toplists');
                break;
            case 'queue':
                self.leftView = $('#left .menu .queue');
                self.rightView = $('#right .queue');
                break;
            case 'search':
                self.leftView = $('#left .menu .search');
                self.rightView = $('#right .search');
                break;
            case 'favorites':
                self.leftView = $('#left .menu .favorites');
                self.rightView = $('#right .favorites');
                break;
        }
        return self;
    };
    
    var select = function() {
        /* Remove selected on all menus*/
        $('#left .menu li').removeClass('selected');
        self.leftView.addClass('selected');
        
        /* Display right tabs */
        self.rightView.siblings().hide();
        self.rightView.show();
        
        /* Display the right video list*/
        if (self.rightView.find('.panel.active').length === 0) {
            self.rightView.find('.panel:first')
                .show()
                .addClass('active');
        }
        return self;
    };
}