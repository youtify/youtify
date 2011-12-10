var VideoInfo = {
    init: function() {
        EventSystem.attachEventHandler('video_started_playing_successfully', VideoInfo.loadYouTubeVideoInfo);
        EventSystem.attachEventHandler('video_info_fetched', VideoInfo.loadLinko);
        EventSystem.attachEventHandler('video_info_fetched', VideoInfo.loadYouTubeUploader);
    },

    loadYouTubeUploader: function(videoInfo) {
		var url = videoInfo.author.uri + "?callback=?";
		var params = {
			'alt': 'json-in-script',
			'prettyprint': true,
			'v': 2
		};

        var info = videoInfo.author;

		$.getJSON(url, params, function(data) {
            info.thumbnail = data.entry.media$thumbnail.url;
            EventSystem.callEventHandlers('uploader_info_fetched', info);
        });
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
			info.author = {
                name: data.entry.author[0].name.$t,
                uri: data.entry.author[0].uri.$t
            };
			info.title = data.entry.title.$t;

            try {
                info.description = data.entry.media$group.media$description.$t;
            } catch (e) {
                info.description = '';
            }

            try {
                info.thumbnail = data.entry.media$group.media$thumbnail[0].url;
            } catch (e) {
                info.thumbnail = null;
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
