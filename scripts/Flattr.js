var Flattr = {
    $badge: null,

    init: function() {
        Flattr.$badge = $('#bottom .flattr .badge');

        $('#bottom .flattr, #bottom .info .title').click(function() {
            Flattr.$badge.text('0').hide();

            if (has_flattr_access_token) { // global
                $('#video-info-popup .connected').show();
                $('#video-info-popup .disconnected').hide();
            } else {
                $('#video-info-popup .connected').hide();
                $('#video-info-popup .disconnected').show();
            }
            $(this).arrowPopup('#video-info-popup', 'down');
        });

        $('#video-info-popup .disconnected button').click(function() {
            location.href = '/flattrconnect';
        });

        EventSystem.addEventListener('video_started_playing_successfully', Flattr.clearPopup);
        EventSystem.addEventListener('video_info_fetched', Flattr.loadVideo);
        EventSystem.addEventListener('uploader_info_fetched', Flattr.loadUploader);
        EventSystem.addEventListener('artist_twitter_account_found', Flattr.loadTwitter);
    },

	clearPopup: function(video) {
        Flattr.$badge.text('0').hide();
        $('#video-info-popup .things .content').removeClass('found').text('Not found');
    },

    createThingElem: function(args) {
        var $div = $('<div class="content found"></div>');

        $('<a class="subtitle" target="_blank"></a>').attr('href', args.a.link).text(args.a.text).appendTo($div);

        if (args.image) {
            $('<img></img>').attr('src', args.image).appendTo($div);
        }

        $('<span class="button"><span class="count">' + args.flattrs + '</span><span class="text">Flattr</span></span>')
            .click(function() {
                var $button = $(this);
                var url;
                var postParams;

                function increaseCount() {
                    var $count = $button.find('.count');
                    $count.text(String(Number($count.text()) + 1));
                }
                function decreaseCount() {
                    var $count = $button.find('.count');
                    $count.text(String(Number($count.text()) - 1));
                }

                if ($button.hasClass('loading')) {
                    return;
                }

                $button.addClass('loading');

                // Always update the count
                increaseCount();

                if (args.thingId) {
                    url = '/flattrclick';
                    postParams = {
                        thing_id: args.thingId
                    };
                } else {
                    url = '/flattrautosubmit';
                    postParams = {
                        url: args.url
                    };
                }
                $.post(url, postParams, function(data) {
                    $button.removeClass('loading');
                    if (data === null) {
                        alert("Error: response from Flattr was null");
                        decreaseCount();
                    } else if (data.hasOwnProperty('error_description')) {
                        alert(data.error_description);
                        decreaseCount();
                    }
                });
            }).appendTo($div);

        return $div;
    },

    loadTwitter: function(twitterUrl) {
        console.log('looking up flattr thing for ' + twitterUrl);

        var screenName = twitterUrl.split('/')[3];
        var url = 'https://api.twitter.com/1/users/show.json?screen_name=' + screenName +'&include_entities=true&callback=?';
        var $twitter = $('#video-info-popup .twitter');

        $.getJSON(url, function(twitterData) {
            var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(twitterUrl) + '&jsonp=?';
            $.getJSON(url, function(flattrData) {
                Flattr.$badge.text(String(Number(Flattr.$badge.text()) + 1)).show();
                $twitter.find('.content').replaceWith(
                    Flattr.createThingElem({
                        a: {
                            text: '@' + screenName,
                            link: twitterUrl
                        },
                        image: twitterData.profile_image_url,
                        url: twitterUrl,
                        flattrs: flattrData.flattrs || 0
                    })
                );
            });
        });
    },

    loadVideo: function(info) {
        var thingUrl = info.video.getYouTubeUrl();
        var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(thingUrl) + '&jsonp=?';
        var $video = $('#video-info-popup .things .video');

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
                        flattrs: data.flattrs
                    })
                );
            }
        });
    },

    loadUploader: function(info) {
        var thingUrl = 'http://www.youtube.com/user/' + info.name;
        var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(thingUrl) + '&jsonp=?';
        var $uploader = $('#video-info-popup .things .uploader');

        console.log('looking up flattr thing for ' + thingUrl);

        $.getJSON(url, function(data) {
            if (data.message !== 'not_found') {
                Flattr.$badge.text(String(Number(Flattr.$badge.text()) + 1)).show();
                $uploader.find('.content').replaceWith(
                    Flattr.createThingElem({
                        a: {
                            text: data.title,
                            link: data.link
                        },
                        image: info.thumbnail,
                        thingId: data.id,
                        flattrs: data.flattrs
                    })
                );
            }
        });
    }
};
