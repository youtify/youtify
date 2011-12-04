var Flattr = {
    init: function() {
        $('#bottom .flattr').click(function() {
            if (has_flattr_access_token) { // global
                $('#flattr-popup .connected').show();
                $('#flattr-popup .disconnected').hide();
            } else {
                $('#flattr-popup .connected').hide();
                $('#flattr-popup .disconnected').show();
            }
            $(this).arrowPopup('#flattr-popup', 'down');
        });

        $('#flattr-popup .disconnected button').click(function() {
            alert("yes");
            window.open('/flattrconnect');
        });

        EventSystem.attachEventHandler('video_info_fetched', Flattr.loadVideo);
        EventSystem.attachEventHandler('video_info_fetched', Flattr.loadVideo);
    },

    loadTwitter: function(payload) {
        var screenName = 'JLo';
        var url = 'https://api.twitter.com/1/users/show.json?screen_name=' + screenName +'&include_entities=true&callback=?';
        var $twitter = $('#flattr-popup .twitter');

        $twitter.html('');

        $.getJSON(url, function(data) {
            $('<img></img>').attr('src', data.profile_image_url).appendTo($twitter);
            $('<span class="username"></span>').text(data.name + ' (@' + screenName + ')').appendTo($twitter);
        });
    },

    loadVideo: function(info) {
        // WIP, flattr needs to fix so that the lookup resource does not loose
        // the jsonp callback in the redirect if a thing is found,
        // alternatively pass along the jsonp callback.

        console.log(info);

        var $li = $('#flattr-popup .things .video');
        //var thingUrl = "http://www.youtify.com"; // does not work
        //var thingUrl = "blog.perthulin.com"; // not found
        var thingUrl = info.video.getYouTubeUrl();
        var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(thingUrl) + '&jsonp=?';

        $li.removeClass('found').removeClass('loading');
        $li.addClass('loading');

        $.getJSON(url, function(data) {
            $li.removeClass('loading');
            if (data.message !== undefined && data.message === 'not_found') {
                $li.addClass('notfound');
                $li.find('.content').text("No flattr thing registered for " + thingUrl);
            } else {
                $li.addClass('found');
                $li.find('.flattres').text(data.flattres);
                $li.find('.content').text(thingUrl);
            }
        });
    },
};
