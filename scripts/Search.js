
var Search = {
    menuItem: null,
    youtubeVideosTab: null,
    youtubePlaylistsTab: null,
    searchTimeoutHandle: null,
    currentQuery: '',
    alternatives: undefined,
    lastVideosSearchQuery: undefined,
    lastPlaylistsSearchQuery: undefined,
    
    init: function() {
        /* Search on key up */
        $('#top .search input').keyup(function(event) {
            var i, 
                deadKeys = [9,16,17,18,37,38,39,40];
            for (i = 0; i < deadKeys.length; i += 1) {
                if (event.keyCode === deadKeys[i]) {
                    return;
                }
            }
            
            var timeout = 700,
                q = $.trim($('#top .search input').val());

            if (Search.searchTimeoutHandle) {
                clearTimeout(Search.searchTimeoutHandle);
            }
            
            if (event.keyCode === 13) {
                Search.search(q);
            } else {
                Search.searchTimeoutHandle = setTimeout(function() {
                    Search.search(q);
                }, timeout);
            }
        });
        $('#top .search button').click(function() {
            Search.search($.trim($('#top .search input').val()));
        });
        EventSystem.addEventListener('video_started_playing_successfully', function() {
            Search.alternatives = undefined;
        });
    },
    getType: function() {
        return Search.youtubeVideosTab.isSelected() ? 'youtube-videos' : 'youtube-playlists';
    },
    search: function(q, loadMore) {
        var url = null,
            start = null,
            params = null;
        history.pushState(null, null, encodeURI('/search?q=' + q));
        Search.menuItem.select();
        Search.currentQuery = q;
        $('body').addClass('searching');

        switch(Search.getType()) {
            case 'youtube-videos':
                if (Search.lastVideosSearchQuery === q && !loadMore) {
                    return;
                } else {
                    Search.lastVideosSearchQuery = q;
                }
                /* Get the results */
                url = 'http://gdata.youtube.com/feeds/api/videos?callback=?';
                start = (loadMore) ? Search.youtubeVideosTab.paneView.data('results-count') + 1 : 1;
                params = {
                    'alt': 'json-in-script', 'max-results': 30,
                    'start-index': start,
                    'format': 5, 'q': q
                };
                
                /* Clean up destination */
                if (loadMore) {
                    Search.youtubeVideosTab.paneView.find('.loadMore').remove();
                } else {
                    Search.youtubeVideosTab.paneView.html('');
                }
                
                /* Get the results */
                $.getJSON(url, params, function(data) {
                    /* Parse the results and create the views */
                    var results = Search.getVideosFromYouTubeSearchData(data);
                    $.each(results, function(i, video) {
                        if (video) {
                            video.createListView().appendTo(Search.youtubeVideosTab.paneView);
                        }
                    });
                    /* Add load more row */
                    if (results.length) {
                        Search.youtubeVideosTab.paneView.data('results-count', results.length);
                        Search.createLoadMoreRow(Search.loadMore).appendTo(Search.youtubeVideosTab.paneView);
                    }
                    $('body').removeClass('searching');
                });
                
                break;
            case 'youtube-playlists':
                if (Search.lastPlaylistsSearchQuery === q && !loadMore) {
                    return;
                } else {
                    Search.lastPlaylistsSearchQuery = q;
                }
                url = "http://gdata.youtube.com/feeds/api/playlists/snippets?callback=?";
                start = (loadMore) ? Search.youtubeVideosTab.paneView.data('results-count') + 1 : 1;
                params = {
                    'alt': 'json-in-script', 'max-results': 30,
                    'start-index': start, 'format': 5, 'v': 2, 'q': q
                };
                /* Clean up destination */
                if (loadMore) {
                    Search.youtubePlaylistsTab.paneView.find('.loadMore').remove();
                } else {
                    Search.youtubePlaylistsTab.paneView.html('');
                }

                /* Get the results */
                $.getJSON(url, params, function(data) {
                    /* Parse the results and create the views */
                    var results = Search.getPlaylistsFromYouTubeSearchData(data);
                    $.each(results, function(i, playlist) {
                        playlist.createView().appendTo(Search.youtubePlaylistsTab.paneView);
                    });
                    /* Add load more row */
                    if (results.length) {
                        Search.youtubePlaylistsTab.paneView.data('results-count', results.length);
                        Search.createLoadMoreRow(Search.loadMore).appendTo(Search.youtubePlaylistsTab.paneView);
                    }
                    $('body').removeClass('searching');
                });
                break;
        }
    },
    createLoadMoreRow: function(callback) {
        var $tr = $('<tr/>')
            .addClass('loadMore')
            .append($('<td/>'))
            .append($('<td class="space"/>'));
        $('<td/>').text('Load more').click(function(event) {
            $(this).addClass('loading');
            callback();
        }).appendTo($tr);
        $tr.append($('<td class="space"/>'))
            .append($('<td/>'))
            .append($('<td class="space"/>'))
            .append($('<td/>'));
        return $tr;
    },
    loadMore: function() {
        Search.search(Search.currentQuery, true);
    },
    getVideosFromYouTubeSearchData: function(data) {
        var results = [];
        if (data.feed.entry === undefined) {
            return results;
        }
        $.each(data.feed.entry, function(i, item) {
            if (item.media$group.media$content === undefined || item.media$group.media$content === null) {
                /* Content is blocked. Move on... */
                results.push(null);
                return;
            }
            
            var url = item.id.$t,
                title = item.title.$t,
                rating,
                videoId;
            
            if (url.match('videos/(.*)$')) {
                videoId = url.match('videos/(.*)$')[1];
            } else {
                videoId = item.media$group.yt$videoid.$t;
            }
            if (item.gd$rating) {
                rating = item.gd$rating.average;
            }

            var video = new Video(videoId, title, 'yt', rating);
            results.push(video);
        });
        return results;
    },
    getPlaylistsFromYouTubeSearchData: function(data) {
        var results = [];
        if (data.feed.entry === undefined) {
            return results;
        }
        
        $.each(data.feed.entry, function(i, item) {
            var playlistId = item.yt$playlistId.$t,
                title = item.title.$t,
                videoCountHint = item.yt$countHint.$t;
            var playlist = new YouTubePlaylist(playlistId, title, videoCountHint);
            results.push(playlist);
        });
        return results;
    },
    findAlternative: function(video, callback) {
        console.log('finding alternative for ' + video.title);
        if (Search.alternatives === undefined) {
            Search.findAlternativesToVideo(video, function(videos) {
                Search.alternatives = videos;
                if (videos.length) {
                    callback(Search.alternatives.shift());
                } else {
                    callback(false);
                }
            });
        } else if (Search.alternatives.length) {
            callback(Search.alternatives.shift());
        } else {
            callback(false);
        }
    },
    findAlternativesToVideo: function(video, callback) {
        var results = [],
            url = 'http://gdata.youtube.com/feeds/api/videos?callback=?',
            params = {
                'alt': 'json-in-script',
                'max-results': 10,
                'start-index': 1,
                'format': 5,
                'q': video.title
            };

		$.getJSON(url, params, function(data) {
			if (data.feed.entry === undefined) {
                callback(results);
                return;
            }
            results = Search.getVideosFromYouTubeSearchData(data);
            callback(results);
		});
    }
};
