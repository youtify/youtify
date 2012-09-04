var InfoFetcher = {
    init: function() {
        var self = this;
        EventSystem.addEventListener('video_started_playing_successfully', function(video) {
            switch (video.type) {
                case 'youtube':
                    self.loadYouTubeVideoInfo(video);
                    break;
                case 'soundcloud':
                    self.loadSoundCloudTrackInfo(video);
                    break;
                case 'officialfm':
                    self.loadOfficialFmTrackInfo(video);
                    break;
            }
        });
        EventSystem.addEventListener('video_info_fetched', function(videoInfo) {
            switch (videoInfo.video.type) {
                case 'youtube':
                    self.loadYouTubeUploader(videoInfo);
                    break;
                case 'soundcloud':
                    break;
                case 'officialfm':
                    break;
            }
        });
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
            info.url = 'http://www.youtube.com/user/' + encodeURIComponent(data.entry.yt$username.$t);
            info.avatar_url = data.entry.media$thumbnail.url;
            EventSystem.callEventListeners('uploader_info_fetched', info);
        });
    },

	loadOfficialFmTrackInfo: function(video) {
        var url = "http://api.official.fm/track/" + video.videoId;
        var params = {
            format: 'json',
            key: OFFICIALFM_API_KEY
        };
        var info = {
            video: video
        };
        $.getJSON(url, params, function(data) {
            data = data[0];
            info.video.title = data.title;
            info.video.duration = data.length * 1000;
            info.url = 'http://official.fm/tracks/' + data.id;
            info.title = data.title;
            info.description = data.description;
            info.thumbnail = data.picture_absolute_url;
            info.author = {
                name: data.artist_string,
                url: data.web_url || data.buy_url,
                user_id: data.user_id
            };
            info.buyLinks = video.buyLinks || data.buy_url ? [data.buy_url] : null;
            EventSystem.callEventListeners('video_info_fetched', info);
            EventSystem.callEventListeners('uploader_info_fetched', info.author);
        });
    },

	loadSoundCloudTrackInfo: function(video) {
        var url = "http://api.soundcloud.com/tracks/" + video.videoId + ".json";
        var params = {
            client_id: SOUNDCLOUD_API_KEY
        };
        var info = {
            video: video
        };
        $.getJSON(url, params, function(data) {
            info.url = data.permalink_url;
            info.title = data.title;
            info.thumbnail = data.artwork_url;
            info.description = data.description;
            info.author = {
                name: data.user.username,
                avatar_url: data.user.avatar_url,
                url: data.user.permalink_url,
                uri: data.user.uri
            };
            info.buyLinks = video.buyLinks || data.purchase_url ? [data.purchase_url] : null;
            EventSystem.callEventListeners('video_info_fetched', info);
            EventSystem.callEventListeners('uploader_info_fetched', info.author);
        });
    },

	loadYouTubeVideoInfo: function(video) {
		var url = "http://gdata.youtube.com/feeds/api/videos/" + video.videoId + "?callback=?";
		var params = {
			'alt': 'json-in-script',
			'prettyprint': true,
			'v': 2
		};
        var externalLink = video.getExternalLink();

        var info = {
            video: video,
            url: externalLink.url
        };

		$.getJSON(url, params, function(data) {
			info.author = {
                name: data.entry.author[0].name.$t,
                uri: data.entry.author[0].uri.$t
            };
			info.title = data.entry.title.$t;

            try {
                info.description = data.entry.media$group.media$description.$t;
            } catch (e1) {
                info.description = '';
            }

            try {
                info.thumbnail = data.entry.media$group.media$thumbnail[0].url;
            } catch (e2) {
                info.thumbnail = null;
            }

            EventSystem.callEventListeners('video_info_fetched', info);
		});
	}
};
