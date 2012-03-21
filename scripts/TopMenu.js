var TopMenu = {
    hasLoadedAboutPopupHtml: false,
    init: function() {
        // PROFILE
        EventSystem.addEventListener('user_profile_updated', function(params) {
            $('#top .profile .nickname').text(params.nickname);
        });

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

        // SETTINGS
        $('#top .settings').click(function() {
            $(this).arrowPopup('#settings');
        });
    }
};
