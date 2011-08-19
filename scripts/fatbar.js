function fatBar_Init() {
    $('#fatbar-toggle .show').click(FatBar.show);
    $('#fatbar-toggle .hide').click(FatBar.hide);
    if (JSON.parse(localStorage['fatbar-toggle'] || "false")) {
        FatBar.show();
    } else {
        FatBar.hide();
    }
}

var FatBar = {
	loadFromVideo: function(video) {
		FatBar._loadVideoInfo(video);
		FatBar._loadRelatedInfo(video);
		FatBar._loadLinkosBox(video);
	},
    show: function() {
          $("#fatbar-toggle .show").hide();
          $("#fatbar-toggle .hide").show();
          $("#fatbar").show();
          localStorage['fatbar-toggle'] = JSON.stringify(true);
          $(window).resize();
    },
    hide: function() {
          $("#fatbar-toggle .show").show();
          $("#fatbar-toggle .hide").hide();
          $("#fatbar").hide();
          localStorage['fatbar-toggle'] = JSON.stringify(false);
          $(window).resize();
    },
    isVisible: function() {
        return $('#fatbar').is(':visible');
    },
	_loadRelatedInfo: function(video) {
		$('#related').html('').show();
		var url = "http://gdata.youtube.com/feeds/api/videos/" + video.videoId + "/related?callback=?";
		var params = {
			'alt': 'json-in-script',
			'max-results': 9,
			'prettyprint': true,
			'v': 2
		};
		$.getJSON(url, params, function(data) {
			$.each(data.feed.entry, function(i, item) {
				var url = item['id']['$t'];
				var videoId = url.match('video:(.*)$')[1];
				var title = item['title']['$t'];
				if (item['gd$rating'])
					var rating = item['gd$rating']['average'];
				var resultItem = createResultsItem(title, videoId, rating);
				resultItem.appendTo($('#related'));
			}); 
		});
	},
	_loadVideoInfo: function(video) {
		$('#video-info-box .uploader').text('');
		var url = "http://gdata.youtube.com/feeds/api/videos/" + video.videoId + "?callback=?";
		var params = {
			'alt': 'json-in-script',
			'prettyprint': true,
			'v': 2
		};
		$.getJSON(url, params, function(data) {
			var author = data.entry.author[0].name.$t;
			var uri = data.entry.author[0].uri.$t;
			$('#video-info-box .uploader')
				.click(function() {
					Uploader.loadVideosFromURI(uri);
				})
				.text(author);
		});
	},
    _loadLinkosBox: function(video) {
        $('#linko-box .name').text('');
        $('#linko-box .homepage').hide();
        var artist = extractArtist(video.title);
        if (artist) {
            var url = 'http://linko.fruktsallad.net/artist/' + artist.replace(' ', '_') + '.json?callback=?';
            $.getJSON(url, {}, function(data) {
                if (!data) {
                    return;
                }

                if ('artist_name' in data) {
                    $('#linko-box .name').text(data.artist_name).show();
                }

                if ('Official Homepage' in data.links) {
                    $('#linko-box .homepage').text(data.links['Official Homepage']).attr('href', data.links['Official Homepage']);
                    $('#linko-box .homepage').show();
                }
            });
        }
    }
};
