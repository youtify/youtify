var VideoInfo = {
    init: function() {
        EventSystem.addEventListener('video_started_playing_successfully', function(video) {
            switch (video.type) {
                case 'youtube':
                    VideoInfo.loadYouTubeVideoInfo(video);
                    break;
                case 'soundcloud':
                    VideoInfo.loadSoundCloudTrackInfo(video);
                    break;
                case 'officialfm':
                    VideoInfo.loadOfficialFmTrackInfo(video);
                    break;
            }
        });
        EventSystem.addEventListener('video_info_fetched', VideoInfo.loadLinko);
        EventSystem.addEventListener('video_info_fetched', function(videoInfo) {
            switch (videoInfo.video.type) {
                case 'youtube':
                    VideoInfo.loadYouTubeUploader(videoInfo);
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
            info.thumbnail = data.entry.media$thumbnail.url;
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
            info.title = data[0].title;
            info.description = data[0].description;
            info.author = {
                name: data[0].artist_string,
                user_id: data[0].user_id
            };
            info.thumbnail = data[0].picture_absolute_url;
            EventSystem.callEventListeners('video_info_fetched', info);
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
            info.title = data.title;
            info.thumbnail = data.artwork_url;
            info.description = data.description;
            info.author = {
                name: data.user.username,
                avatar_url: data.user.avatar_url,
                uri: data.user.uri
            };
            EventSystem.callEventListeners('video_info_fetched', info);
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
	},

    loadLinko: function(info) {
        var artist = extractArtist(info.title);

        if (artist) {
            var url = 'http://linko.fruktsallad.net/artist/' + (artist.replace(/ /g, '_')) + '.json?callback=?';
            $.getJSON(url, {}, function(data) {
                if (!data || !data.links || !data.hasOwnProperty('artist_name')) {
                    return;
                } else {
                    if (data.links.hasOwnProperty('Twitter')) {
                        EventSystem.callEventListeners('artist_twitter_account_found', data.links.Twitter);
                    }
                }
            });
        }
    }
};
