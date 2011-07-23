$(document).ready(function() {
    var timeoutId = null;

	// SEARCH OPTIONS
    $('#search-options input').each(function(i, elem) {
        if (localStorage['search-options'] === $(elem).attr('id')) {
            $(elem).attr('checked', 'checked');
        }
    });

	$('#search-options input').change(function() {
        if ($(this).is(':checked')) {
            localStorage['search-options'] = $(this).attr('id');
			Search.q = ''; // Clear search
            $('#search input').keyup();
        }
	});

	// SEARCH
	$('#search input').keyup(function(event) {
		
		Search.selectSearchResults();
        var timeout = 0;

        if ($('#search input').val().length > 1 && event.keyCode != 13) {
            timeout = 500;
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(function() {
			var url = null,
                params = null,
                q = $.trim($('#search input').val());

            if ((q && q !== Search.q) || event.keyCode == 13) {
                Search.search(q);
            }
        }, timeout);
    });

    // LOAD ANY PREVIOUS SEARCH
    if ('q' in localStorage) {
        $("#search input").val(localStorage['q']);
        $("#search input").keyup(); // trigger search
    }
	
	$('#results-tab').click(function() {
		Search.selectSearchResults();
	});
});

var Search = {
	q: '',
	playlistsStart: 0,
	videosStart: 0,

    search: function(q) {
        if (typeof q === undefined) {
            q = Search.q;
        }

        $('body').addClass('searching');
        localStorage['q'] = q;

        $('#results').html('');
        
        if ($('#search-options-playlists').is(':checked')) {
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

		var url = "http://gdata.youtube.com/feeds/api/playlists/snippets?callback=?";
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
				var title = item['title']['$t'];
				var url = item['id']['$t'];
				var playlistId = item['yt$playlistId']['$t'];
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
				var url = item['id']['$t'];
				var videoId = url.match('videos/(.*)$')[1];
				var title = item['title']['$t'];
				if (item['gd$rating'])
					var rating = item['gd$rating']['average'];
				var resultItem = createResultsItem(title, videoId, rating);
				resultItem.appendTo('#results');
				
				if (i === 0 && continuePlaying === true) {
					resultItem.dblclick();
				}
			});

			if (data.feed.entry.length > 0) {
				$('<li/>').addClass('loadMore').text('Load more').click(function(event) {
                    $(this).addClass('loading');
                    Search.searchVideos('', true);
                }).appendTo('#results');
            }
		});
	},
	selectSearchResults: function() {
		$('#left-menu li').removeClass('selected');
		$('#results-tab').addClass('selected');
		$('#results-container ol').hide();
		$('#results').show();
	},
	
	findAndPlayAlternative: function(elem) {
		var url = 'http://gdata.youtube.com/feeds/api/videos?callback=?';
		var params = {
			'alt': 'json-in-script',
			'max-results': 50,
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
				var url = item['id']['$t'];
				var videoId = url.match('videos/(.*)$')[1];
				var title = item['title']['$t'];
				var alternativeItem = createResultsItem(title, videoId).addClass('alternative');

				var next = $('<input type="button" value="Next alternative &raquo" />').addClass('next').click(function() {
					Player.playNextAlternative();
				});
				next.appendTo(alternativeItem);

				var prev = $('<input type="button" value="&laquo" />').addClass('prev').click(function() {
					Player.playPrevAlternative();
				});
				prev.appendTo(alternativeItem);

				alternativeItem.appendTo(list);
			});
			
			list.appendTo(elem);
			list.find('li:first-child').play();
		});
	}
};
