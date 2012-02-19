var InfoButton = {
    $badge: null,

    init: function() {
        InfoButton.$badge = $('#bottom .info .badge');

        $('#bottom .info .title').click(function() {
            InfoButton.$badge.text('0').hide();
            $(this).arrowPopup('#video-info-popup', 'down');
        });

        EventSystem.addEventListener('video_started_playing_successfully', InfoButton.clearPopup);
        EventSystem.addEventListener('video_info_fetched', InfoButton.loadVideo);
        EventSystem.addEventListener('uploader_info_fetched', InfoButton.loadUploader);
        EventSystem.addEventListener('artist_twitter_account_found', InfoButton.loadTwitter);
    },

	clearPopup: function(video) {
        InfoButton.$badge.text('0').hide();
        $('#video-info-popup .things .content').removeClass('found').text('Not found');
    },

    createThingElem: function(args) {
        var $div = $('<div class="content found"></div>');

        var $titleAndDescription = $('<div class="title-and-description"></div>');
        $('<a class="subtitle" target="_blank"></a>').attr('href', args.a.link).text(args.a.text).appendTo($titleAndDescription);
        if (args.description) {
            var $description = $('<p class="description"></p>');
            $('<span></span').text(Utils.shorten(args.description, 140) + ' ').appendTo($description);
            if (args.description.length > 140) {
                /*$('<a class="more" href="#"></a>').text('More').click(function() {
                    alert('show complete description');
                }).appendTo($description);*/
            }
            $description.appendTo($titleAndDescription);
        }
        $titleAndDescription.appendTo($div);

        if (args.image) {
            $('<img></img>').attr('src', args.image).appendTo($div);
        }

        if (args.flattrs !== null) {
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
        }

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
                InfoButton.$badge.text(String(Number(InfoButton.$badge.text()) + 1)).show();
                $twitter.find('.content').replaceWith(
                    InfoButton.createThingElem({
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
                InfoButton.$badge.text(String(Number(InfoButton.$badge.text()) + 1)).show();
            }

            $video.find('.content').replaceWith(
                InfoButton.createThingElem({
                    a: {
                        text: data.title || info.title,
                        link: data.link || info.video.getYouTubeUrl()
                    },
                    description: info.description,
                    image: info.thumbnail,
                    thingId: data.id || null,
                    flattrs: data.flattrs || null
                })
            );
        });
    },

    loadUploader: function(info) {
        var thingUrl = 'http://www.youtube.com/user/' + info.name;
        var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(thingUrl) + '&jsonp=?';
        var $uploader = $('#video-info-popup .things .uploader');

        console.log('looking up flattr thing for ' + thingUrl);

        $.getJSON(url, function(data) {
            if (data.message !== 'not_found') {
                InfoButton.$badge.text(String(Number(InfoButton.$badge.text()) + 1)).show();
            }
            $uploader.find('.content').replaceWith(
                InfoButton.createThingElem({
                    a: {
                        text: data.title || info.name,
                        link: data.link || info.url
                    },
                    image: info.avatar_url,
                    thingId: data.id || null,
                    flattrs: data.flattrs || null
                })
            );
        });
    }
};
