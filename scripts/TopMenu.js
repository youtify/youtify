var TopMenu = {
    hasLoadedAboutPopupHtml: false,
    init: function() {
        // ABOUT
        $('#top .about').click(function() {
            $(this).arrowPopup('#about-popup');
            if (!TopMenu.hasLoadedAboutPopupHtml) {
                $.ajax({
                    url: '/about',
                    statusCode: {
                        200: function(data) {
                            TopMenu.hasLoadedAboutPopupHtml = true;
                            $('#about-popup').html(data);
                            $('#about-popup .share iframe').css('height', '62px').css('width', '55px');

                            // FUNNY LOGO
                            $('#about-popup .logo').click(function() {
                                player.play(new Video(player._hiddenPlaylist[new Date().getWeek()]));
                            });
                        }
                    }
                });
            }
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
