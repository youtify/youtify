var Uploader = {
	loadVideosFromURI: function(uri) {
		var url = uri + '/uploads?callback=?';
		var params = {
			'alt': 'json-in-script',
			'v': 2
		};

		$.getJSON(url, params, function(data) {			
			if (data.feed.entry === undefined) {
				return;
            }
			$('#results').html('');
			$.each(data.feed.entry, function(i, item) {
				var url = item.id.$t;
				var videoId = url.match('video:(.*)$')[1];
				var title = item.title.$t;
				if (item.gd$rating) {
					var rating = item.gd$rating.average;
                }
				var resultItem = createResultsItem(title, videoId, rating);
				resultItem.appendTo('#results');				
			});
		});
		Search.selectSearchResults();
	}
};
