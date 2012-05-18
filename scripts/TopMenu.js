var TopMenu = {
    hasLoadedAboutPopupHtml: false,
    init: function() {

        // PROFILE
        if (UserManager.currentUser) {
            $('#top .profile .picture').replaceWith('<img class="picture" src="'+ UserManager.currentUser.smallImageUrl + '" />');
            $('#top .profile .display-name').text(UserManager.currentUser.displayName);
            $('#top .profile').show();

            EventSystem.addEventListener('user_profile_updated', function(params) {
                $('#top .profile .display-name').text(params.displayName);
            });
        } else {
            $('#top .profile').hide();
        }


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

        // SETTINGS
        $('#top .settings').click(function() {
            $(this).arrowPopup('#settings');
        });
    }
};
