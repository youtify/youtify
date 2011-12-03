var Flattr = {
    init: function() {
        $('#bottom .flattr').click(function() {
            $(this).arrowPopup('#flattr-popup', 'down');
            Flattr.initPopup();
        });

        $('#flattr-popup .disconnected button').click(function() {
            alert("yes");
            window.open('/flattrconnect');
        });
    },

    initPopup: function() {
        if (has_flattr_access_token) { // global
            var screenName = 'JLo';
            var url = 'https://api.twitter.com/1/users/show.json?screen_name=' + screenName +'&include_entities=true&callback=?';
            var $twitter = $('#flattr-popup .twitter');

            $twitter.html('');

            $.getJSON(url, function(data) {
                $('<img></img>').attr('src', data.profile_image_url).appendTo($twitter);
                $('<span class="username"></span>').text(data.name + ' (@' + screenName + ')').appendTo($twitter);
            });

            $('#flattr-popup .disconnected').hide();
        } else {
            $('#flattr-popup .connected').hide();
            $('#flattr-popup .disconnected').show();
        }
    }
};
