var InfoPanel = {
	loadFromTag: function(songTag) {
		InfoPanel._loadVideoInfo(songTag);
		InfoPanel._loadRelatedInfo(songTag);
	},
	_loadRelatedInfo: function(songTag) {
		$('#related').html('');
		var url = "http://gdata.youtube.com/feeds/api/videos/" + songTag + "/related?callback=?";
		var params = {
			'alt': 'json-in-script',
			'max-results': 10,
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
	_loadVideoInfo: function(songTag) {
		$('#uploader').html('');
		var url = "http://gdata.youtube.com/feeds/api/videos/" + songTag + "?callback=?";
		var params = {
			'alt': 'json-in-script',
			'prettyprint': true,
			'v': 2
		};
		$.getJSON(url, params, function(data) {
			var author = data.entry.author[0].name.$t;
			var uri = data.entry.author[0].uri.$t;
			$('#uploader').text(translations.Uploader);
			$('<a/>')
				.attr('href', 'javascript:void(0);')
				.click(function() {
					Uploader.loadVideosFromURI(uri);
				})
				.text(author)
				.appendTo($('#uploader'));
		});
	}
};
