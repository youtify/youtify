var InfoPopup = {
    init: function() {
        EventSystem.addEventListener('video_started_playing_successfully', InfoPopup.clearPopup);
        EventSystem.addEventListener('video_info_fetched', InfoPopup.loadVideo);
        EventSystem.addEventListener('uploader_info_fetched', InfoPopup.loadUploader);
        EventSystem.addEventListener('artist_twitter_account_found', InfoPopup.loadTwitter);
    },

	clearPopup: function(video) {
        $('#video-info-popup .sections li').removeClass('found');
        $('#video-info-popup .sections .content').text('Not found');
    },

    createSection: function(args) {
        var $div = $('<div class="content"></div>');

        var $titleAndDescription = $('<div class="title-and-description"></div>');
        var $a = $('<a class="subtitle" target="_blank"></a>').attr('href', args.a.link).text(args.a.text).click(args.a.callback).appendTo($titleAndDescription);
        
        if (args.buyLinks && args.buyLinks.length) {
            var $buyLink = $('<p class="buy-links"></p>');
            var i;
            for (i = 0; i < args.buyLinks.length; i += 1) {
                $('<a/>').attr('href', args.buyLinks[i]).attr('target', '_blank').text(TranslationSystem.get('Buy this track')).appendTo($buyLink);
                $('<br/>').appendTo($buyLink);
            }
            $buyLink.appendTo($titleAndDescription);
        }

        if (args.description) {
            var $description = $('<p class="description"></p>');
            $('<span/>').text(Utils.shorten(args.description, 140) + ' ').appendTo($description);
            if (args.description.length > 140) {
                $('<a class="more" href="#"/>').text(TranslationSystem.get('More')).click(function() {
                    $description.text(args.description);
                    $('#bottom .info .title').arrowPopup('#video-info-popup', 'down');
                }).appendTo($description);
            }
            $description.appendTo($titleAndDescription);
        }

        $titleAndDescription.appendTo($div);

        if (args.image) {
            $('<img></img>').attr('src', args.image).appendTo($div);
        }

        return $div;
    },

    loadTwitter: function(twitterUrl) {
        var screenName = twitterUrl.split('/')[3];
        var url = 'https://api.twitter.com/1/users/show.json?screen_name=' + screenName +'&include_entities=true&callback=?';
        var $twitter = $('#video-info-popup .twitter');

        $.getJSON(url, function(twitterData) {
            $twitter.addClass('found');
            $twitter.find('.content').replaceWith(
                InfoPopup.createSection({
                    a: {
                        text: '@' + screenName,
                        link: twitterUrl
                    },
                    image: twitterData.profile_image_url,
                    url: twitterUrl
                })
            );
        });
    },

    loadVideo: function(info) {
        var $video = $('#video-info-popup .sections .video');

        $video.addClass('found');
        $video.find('.content').replaceWith(
            InfoPopup.createSection({
                a: {
                    text: info.title,
                    link: info.url
                },
                description: info.description,
                image: info.thumbnail,
                buyLinks: info.buyLinks
            })
        );
    },

    loadUploader: function(info) {
        var $uploader = $('#video-info-popup .sections .uploader');
        var callback;

        if (info.url.match('soundcloud') || info.url.match('youtube')) {
            callback = function(event) {
                ExternalUserPage.show(info.url);
                event.preventDefault();
            };
        }

        $uploader.addClass('found');
        $uploader.find('.content').replaceWith(
            InfoPopup.createSection({
                a: {
                    text: info.name,
                    link: info.url,
                    callback: callback
                },
                image: info.avatar_url
            })
        );
    }
};
