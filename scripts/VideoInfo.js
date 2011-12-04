var VideoInfo = {
    init: function() {
        EventSystem.attachEventHandler('video_started_playing_successfully', VideoInfo.loadYouTubeVideoInfo);
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
};
