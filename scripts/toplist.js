function toplist_Init() {
	$('#toplist-tab').click(function() {
		TopList.select();
	});
	$('#bestof-tab').click(function() {
		BestOfYouTube.select();
	});
}

var BestOfYouTube = { 
	select: function() {
        history.pushState(null, null, '/');
        $('#playlistbar').hide();
        $('#searchbar').hide();
		$('#left-menu li').removeClass('selected');
		$('#bestof-tab').addClass('selected');
		if ($('#bestof').html().length === 0) {
			$('#bestof-tab').addClass('loading');
			BestOfYouTube.load();
		}
		$('.results').hide().removeClass('active');
		$('#bestof').show().addClass('active');
	},

	load: function() {
        var url = "http://gdata.youtube.com/feeds/api/standardfeeds/JP/top_rated_Music?v=2&alt=json-in-script&max-results=50&callback=?";

        $('#bestof').html('');
        $.getJSON(url, {}, function (data) {
            $.each(data.feed.entry, function(i, item) {
                var videoId = item.media$group.yt$videoid.$t;
                var title = item.title.$t;
                createResultsItem(title, videoId).appendTo('#bestof');
            });
            $('#bestof-tab').removeClass('loading');
        });

	}
};

var TopList = { 
	select: function() {
        history.pushState(null, null, '/');
        $('#playlistbar').hide();
        $('#searchbar').hide();
		$('#left-menu li').removeClass('selected');
		$('#toplist-tab').addClass('selected');
		if ($('#toplist').html().length === 0) {
			$('#toplist-tab').addClass('loading');
			TopList.load();
		}
		$('.results').hide().removeClass('active');
		$('#toplist').show().addClass('active');
	},

	load: function() {
        $('#toplist').html('');

        $.each(toplist, function (i, item) {
            createResultsItem(item.title, item.videoId).appendTo('#toplist');
        });

        $('#toplist-tab').removeClass('loading');
	}
};
