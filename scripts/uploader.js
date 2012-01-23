var Uploader = {
	loadVideosFromURI: function(uri) {
		var url = uri + '/uploads?callback=?';
		var params = {
			'alt': 'json-in-script',
			'v': 2
		};

        $('#left .search').data('model').select();
        $('#right .search .tabs .youtube.videos').data('model').select();

		$.getJSON(url, params, function(data) {			
            var $table = $('#right .pane.youtube.videos');

			if (data.feed.entry === undefined) {
				return;
            }

            $table.html('');

			$.each(data.feed.entry, function(i, item) {
				var url = item.id.$t;
				var videoId = url.match('video:(.*)$')[1];
				var title = item.title.$t;
				if (item.gd$rating) {
					var rating = item.gd$rating.average;
                }
				var resultItem = new Video(videoId, title, 'youtube', rating).createListView();
				resultItem.appendTo($table);
			});
		});
	}
};
