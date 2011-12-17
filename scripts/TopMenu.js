var TopMenu = {
    init: function() {
        // ABOUT
        $('#top .about').click(function() {
            $(this).arrowPopup('#infomenu-popup');
        });

        // LOGOUT POPUP
        $('#top .username').click(function() {
            $(this).arrowPopup('#logout-popup');
        });
        $('#logout-popup a').click(function(e) {
            playlistManager.removeRemotePlaylistsFromLocalStorage();
        });
    }
};
