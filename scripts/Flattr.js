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
            window.open('/flattrconnect');
        });

        EventSystem.attachEventHandler('video_started_playing_successfully', Flattr.clearPopup);
        EventSystem.attachEventHandler('video_info_fetched', Flattr.loadVideo);
        EventSystem.attachEventHandler('artist_twitter_account_found', Flattr.loadTwitter);
    },

	clearPopup: function(video) {
        $('#flattr-popup .things').html('');
    },

    createPopupFlattrItem: function(args) {
        var $li = $('<li></li>').addClass(args.className).addClass('found');

        $('<h2></h2>').text(args.title).appendTo($li);
        $('<a class="subtitle" target="_blank"></a>').attr('href', args.a.link).text(args.a.text).appendTo($li);

        if (args.image) {
            $('<img></img>').attr('src', args.image).appendTo($li);
        }

        $('<span class="button"><span class="count">' + args.flattres + '</span><span class="text">Flattr</span></span>').appendTo($li);

        return $li;
    },

    createNotFoundItem: function(args) {
        var $li = $('<li></li>').addClass(args.className).addClass('notfound');

        $('<h2></h2>').text(args.title).appendTo($li);
        $('<span class="content"></span>').text(args.content).appendTo($li);

        return $li;
    },

    loadTwitter: function(twitterUrl) {
        console.log('looking up flattr thing for ' + twitterUrl);

        var screenName = twitterUrl.split('/')[3];
        var url = 'https://api.twitter.com/1/users/show.json?screen_name=' + screenName +'&include_entities=true&callback=?';
        var $twitter = $('#flattr-popup .twitter');

        $twitter.html('');

        $.getJSON(url, function(data) {
            Flattr.createPopupFlattrItem({
                className: 'twitter',
                a: {
                    text: '@' + screenName,
                    link: twitterUrl
                },
                subtitle: '@' + screenName,
                title: 'Artist Twitter Account',
                image: data.profile_image_url,
                flattres: 0
            }).appendTo('#flattr-popup .things');
        });
    },

    loadVideo: function(info) {
        // WIP, flattr needs to fix so that the lookup resource does not loose
        // the jsonp callback in the redirect if a thing is found,
        // alternatively pass along the jsonp callback.

        //var thingUrl = "http://www.youtify.com"; // does not work
        //var thingUrl = "blog.perthulin.com"; // not found
        var thingUrl = info.video.getYouTubeUrl();
        var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(thingUrl) + '&jsonp=?';

        console.log('looking up flattr thing for ' + thingUrl);

        $.getJSON(url, function(data) {
            if (data.message !== undefined && data.message === 'not_found') {
                Flattr.createNotFoundItem({
                    className: 'video',
                    title: 'YouTube Video',
                    content: 'No flattr thing registered for ' + thingUrl
                }).appendTo('#flattr-popup .things');
            } else {
                $li.addClass('found');
                $li.find('.flattres').text(data.flattres);
                $li.find('.content').text(thingUrl);
            }
        });
    },
};
