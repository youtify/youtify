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
        $('<a class="subtitle" target="_blank"></a>').attr('href', args.a.link).text(args.a.text).appendTo($titleAndDescription);

        if (args.description) {
            var $description = $('<p class="description"></p>');
            $('<span></span').text(Utils.shorten(args.description, 140) + ' ').appendTo($description);
            if (args.description.length > 140) {
                $('<a class="more" href="#"></a>').text('More').click(function() {
                    alert('show complete description');
                });//.appendTo($description);
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
                image: info.thumbnail
            })
        );
    },

    loadUploader: function(info) {
        var $uploader = $('#video-info-popup .sections .uploader');

        $uploader.addClass('found');
        $uploader.find('.content').replaceWith(
            InfoPopup.createSection({
                a: {
                    text: info.name,
                    link: info.url
                },
                image: info.avatar_url
            })
        );
    }
};
