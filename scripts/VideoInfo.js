var VideoInfo = {
    init: function() {
        EventSystem.attachEventHandler('video_started_playing_successfully', VideoInfo.loadYouTubeVideoInfo);
        EventSystem.attachEventHandler('video_info_fetched', VideoInfo.loadLinko);
    },

	loadYouTubeVideoInfo: function(video) {
		var url = "http://gdata.youtube.com/feeds/api/videos/" + video.videoId + "?callback=?";
		var params = {
			'alt': 'json-in-script',
			'prettyprint': true,
			'v': 2
		};

        var info = {
            video: video
        };

		$.getJSON(url, params, function(data) {
			info.author = data.entry.author[0].name.$t;
			info.title = data.entry.title.$t;
			info.author_uri = data.entry.author[0].uri.$t;

            try {
                info.description = data.entry.media$group.media$description.$t;
            } catch (e) {
                info.description = '';
            }

            EventSystem.callEventHandlers('video_info_fetched', info);
		});
	},

    loadLinko: function(info) {
        var artist = extractArtist(info.title);

        if (artist) {
            var url = 'http://linko.fruktsallad.net/artist/' + (artist.replace(/ /g, '_')) + '.json?callback=?';
            $.getJSON(url, {}, function(data) {
                if (!data || !data.links || !data.hasOwnProperty('artist_name')) {
                    return;
                } else {
                    if ('Twitter' in data.links) {
                        EventSystem.callEventHandlers('artist_twitter_account_found', data.links.Twitter);
                    }
                }
            });
        }
    }
};
