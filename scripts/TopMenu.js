var TopMenu = {
    hasLoadedAboutPopupHtml: false,
    init: function() {

        // PROFILE
        $('#top .profile').hide();
        $('#top .activities').hide();
        $('#top .login-link').hide();
        EventSystem.addEventListener('current_user_loaded', function(user) {
            /*$('#top .profile').append('<img src="'+ user.smallImageUrl + '" width="24" height="24" />');*/
            $('#top .profile').css('background-image', 'url(' + user.smallImageUrl + ')');

            $('#top .profile').click(function(event) {
                $(this).arrowPopup('#profile-popup');
            });

            EventSystem.addEventListener('user_profile_updated', function(params) {
                $('#top .profile .display-name').text(params.displayName);
            });

            // I know, not the most natural place to put this...
            $('#profile-popup .profile-page').click(function(event) {
                UserManager.loadCurrentUser();
                Utils.closeAnyOpenArrowPopup();
            });

            $('#top .profile').show();
            $('#top .activities').show();
        });
        EventSystem.addEventListener('user_logged_out', function() {
            $('#top .profile').hide();
            $('#top .activities').hide();
            $('#top .login-link').show();
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

        // NOTIFICATIONS
        $('#top .activities').click(function() {
            $(this).arrowPopup('#activities-popup');
            Activities.loadNotificationsPopup();
        });

        // SETTINGS
        $('#top .settings').click(function() {
            $(this).arrowPopup('#settings');
            SettingsPopup.markAllPuffsAsSeen();
        });
    }
};
