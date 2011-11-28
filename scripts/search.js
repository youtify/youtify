function search_Init() {
    var timeoutId = null;

	$('#searchbar .tab').click(function() {
        $('#searchbar .tab').removeClass('selected');
        $(this).addClass('selected');
        localStorage['search-options'] = $(this).attr('id');
        Search.q = ''; // Clear search
        $('#search input').keyup();
	});

	// SEARCH OPTIONS
    if (localStorage['search-options']) {
        $('#searchbar .tab').removeClass('selected');
        $('#' + localStorage['search-options']).addClass('selected');
    }

	// SEARCH
	$('#top .search input').keyup(function(event) {
		Search.selectSearchResults();
        var timeout = 0;

        var $searchInput = $('#top .search input');

        if ($searchInput.val().length > 1 && event.keyCode !== 13) {
            timeout = 500;
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(function() {
			var url = null,
                params = null,
                q = $.trim($searchInput.val());

            if ((q && q !== Search.q) || event.keyCode === 13) {
                Search.search(q);
            }
        }, timeout);
    });
	
	$('#left .search').click(function() {
		Search.selectSearchResults();
	});
}

var Search = {
	q: '',
	playlistsStart: 0,
	videosStart: 0,

    search: function(q) {
        if (typeof q === undefined) {
            q = Search.q;
        }

        history.pushState(null, null, encodeURI('/search?q=' + q));

        $('body').addClass('searching');

        $('#right .search tbody').html('');
        
        if ($('#right .search .tabs .youtube.playlists').hasClass('selected')) {
            Search.searchPlaylists(q);
        } else {
            Search.searchVideos(q);
        }
    },

	searchPlaylists: function(q, loadMore) {
		if (loadMore === undefined || loadMore === false)  {
			Search.q = q;
        }
		if (loadMore === undefined || loadMore === false) {
			Search.playlistsStart = 0;
        }

		var url = "http://gdata.youtube.com/feeds/api/playlists/snippets?callback=?",
            params = {
                'alt': 'json-in-script',
                'max-results': 30,
                'start-index': Search.playlistsStart + 1,
                'format': 5,
                'v': 2,
                'q': Search.q
            };
		
		$.getJSON(url, params, function(data) {
            $('body').removeClass('searching');
			$('.loadMore').remove();

			if (data.feed.entry === undefined) {
				return;
            }

			Search.playlistsStart += data.feed.entry.length;

			$.each(data.feed.entry, function(i, item) {
				var title = item.title.$t;
				var url = item.id.$t;
				var playlistId = item.yt$playlistId.$t;
				$('<li/>').addClass('playlist').text(title).data('playlistId', playlistId).click(function(event) {
					var parameters = {
                        'event': event,
                        'playlist': $(this)
                    };
					if ($(this).find('ul').length) {
						toggle(null, parameters);
					} else {
						getVidsInPlaylist($(this).data('playlistId'), toggle, parameters);
						$('#results .selected').removeClass('selected');
					}
				}).appendTo('#results');
			});

			if (data.feed.entry.length > 0) {
				$('<li/>').addClass('loadMore').text('Load more').click(function(event) {
                    $(this).addClass('loading');
                    Search.searchPlaylists('', true);
                }).appendTo('#results');
            }
		});
	},
	
	searchVideos: function(q, loadMore, continuePlaying) {
		if (loadMore === undefined || loadMore === false) {
			Search.q = q;
        }
		if (loadMore === undefined || loadMore === false) {
			Search.videosStart = 0;
        }

        var $tbody = $('#right .search table.youtube.videos tbody');

		var url = 'http://gdata.youtube.com/feeds/api/videos?callback=?';
		var params = {
			'alt': 'json-in-script',
			'max-results': 30,
			'start-index': Search.videosStart + 1,
			'format': 5,
			'q': Search.q
		};

		$.getJSON(url, params, function(data) {
            $('body').removeClass('searching');
			$('.loadMore').remove();

			if (data.feed.entry === undefined) {
				return;
            }

			Search.videosStart += data.feed.entry.length;

			$.each(data.feed.entry, function(i, item) {
				var url = item.id.$t;
				var videoId = url.match('videos/(.*)$')[1];
				var title = item.title.$t;
                var rating;

				if (item.gd$rating) {
					rating = item.gd$rating.average;
                }

                var video = new Video(videoId, title, 'youtube', rating);
				video.createListView().appendTo($tbody)
				
				if (i === 0 && continuePlaying === true) {
					resultItem.dblclick();
				}
			});

			if (data.feed.entry.length > 0) {
				$('<li/>').addClass('loadMore').text('Load more').click(function(event) {
                    $(this).addClass('loading');
                    Search.searchVideos('', true);
                }).appendTo($tbody);
            }
		});
	},
	selectSearchResults: function() {
        history.pushState(null, null, '/');

		$('#left .tabs li').removeClass('selected');
		$('#left .tabs li.search').addClass('selected');

		$('#right > .selected').removeClass('selected');
		$('#right > .search').addClass('selected');
	},
	
	findAndPlayAlternative: function(elem) {
		var url = 'http://gdata.youtube.com/feeds/api/videos?callback=?';
		var params = {
			'alt': 'json-in-script',
			'max-results': 10,
			'start-index': 1,
			'format': 5,
			'q': elem.find('.title').text()
		};

		$.getJSON(url, params, function(data) {
			if (data.feed.entry === undefined) {
				elem.addClass('dead');
				Player.next();
				return;
            }
			
			elem.addClass('fake');
			var list = $('<ul/>').addClass('alternatives');
			
			$.each(data.feed.entry, function(i, item) {
				var url = item.id.$t;
				var videoId = url.match('videos/(.*)$')[1];
                if (videoId !== elem.data('videoId')) {
                    var title = item.title.$t;
                    var alternativeItem = new Video(title, videoId, 'yt').createListView().addClass('alternative');

                    $('<input type="button" value="Next alternative &raquo" />')
                        .addClass('next')
                        .click(function() {
                            Player.playNextAlternative();
                        })
                        .appendTo(alternativeItem);

                    $('<input type="button" value="&laquo" />')
                        .addClass('prev')
                        .click(function() {
                            Player.playPrevAlternative();
                        })
                        .appendTo(alternativeItem);

                    alternativeItem.appendTo(list);
                }
			});
			
			list.appendTo(elem);
			list.find('li:first-child').play();
		});
	}
};
