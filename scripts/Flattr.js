var Flattr = {
    $badge: null,

    init: function() {
        Flattr.$badge = $('#bottom .flattr .badge');

        $('#bottom .flattr').click(function() {
            Flattr.$badge.text('0').hide();

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
            location.href = '/flattrconnect';
        });

        EventSystem.attachEventHandler('video_started_playing_successfully', Flattr.clearPopup);
        EventSystem.attachEventHandler('video_info_fetched', Flattr.loadVideo);
        EventSystem.attachEventHandler('artist_twitter_account_found', Flattr.loadTwitter);
    },

	clearPopup: function(video) {
        Flattr.$badge.text('0').hide();
        $('#flattr-popup .things .content').removeClass('found').text('Not found');
    },

    createThingElem: function(args) {
        var $div = $('<div class="content found"></div>');

        $('<a class="subtitle" target="_blank"></a>').attr('href', args.a.link).text(args.a.text).appendTo($div);

        if (args.image) {
            $('<img></img>').attr('src', args.image).appendTo($div);
        }

        $('<span class="button"><span class="count">' + args.flattrs + '</span><span class="text">Flattr</span></span>')
            .click(function() {
                $.post('/flattrclick', {thing_id:args.thingId}, function(data) {
                    alert('flattr click');
                    console.log(data);
                });
            }).appendTo($div);

        return $div;
    },

    loadTwitter: function(twitterUrl) {
        console.log('looking up flattr thing for ' + twitterUrl);

        var screenName = twitterUrl.split('/')[3];
        var url = 'https://api.twitter.com/1/users/show.json?screen_name=' + screenName +'&include_entities=true&callback=?';
        var $twitter = $('#flattr-popup .twitter');

        $.getJSON(url, function(twitterData) {
            var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(twitterUrl) + '&jsonp=?';
            $.getJSON(url, function(flattrData) {
                if (flattrData.message !== 'not_found') {
                    Flattr.$badge.text(String(Number(Flattr.$badge.text()) + 1)).show();
                    $twitter.find('.content').replaceWith(
                        Flattr.createThingElem({
                            a: {
                                text: '@' + screenName,
                                link: twitterUrl
                            },
                            image: twitterData.profile_image_url,
                            thingId: flattrData.id,
                            flattrs: flattrData.flattrs,
                        })
                    );
                }
            });
        });
    },

    loadVideo: function(info) {
        var thingUrl = info.video.getYouTubeUrl();
        var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(thingUrl) + '&jsonp=?';
        var $video = $('#flattr-popup .things .video');

        console.log('looking up flattr thing for ' + thingUrl);

        $.getJSON(url, function(data) {
            if (data.message !== 'not_found') {
                Flattr.$badge.text(String(Number(Flattr.$badge.text()) + 1)).show();
                $video.find('.content').replaceWith(
                    Flattr.createThingElem({
                        a: {
                            text: data.title,
                            link: data.link
                        },
                        image: info.thumbnail,
                        thingId: data.id,
                        flattrs: data.flattrs,
                    })
                );
            }
        });
    },
};
