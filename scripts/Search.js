
var Search = {
    menuItem: null,
    youtubeVideosTab: null,
    soundCloudTracksTab: null,
    officialfmTracksTab: null,
    searchTimeoutHandle: null,
    currentQuery: '',
    alternatives: undefined,
    lastVideosSearchQuery: undefined,
    lastPlaylistsSearchQuery: undefined,
    lastSoundCloudTracksQuery: undefined,
    itemsPerPage: 30,
    
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
        if (Search.soundCloudTracksTab.isSelected()) {
            return 'soundcloud-tracks';
        }
        
        if (Search.officialfmTracksTab.isSelected()) {
            return 'officialfm-tracks';
        }
        
        return Search.youtubeVideosTab.isSelected() ? 'youtube-videos' : 'youtube-playlists';
    },
    search: function(q, loadMore) {
        if (q.length === 0) {
            return;
        }

        var url = null,
            start = null,
            params = null;
        history.pushState(null, null, encodeURI('/search?q=' + q));
        Search.menuItem.select();
        Search.currentQuery = q;

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
                    'alt': 'json-in-script', 'max-results': Search.itemsPerPage,
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
                $('body').addClass('searching');
                $.getJSON(url, params, function(data) {
                    /* Parse the results and create the views */
                    var results = Search.getVideosFromYouTubeSearchData(data);
                    $.each(results, function(i, video) {
                        if (video) {
                            video.onPlayCallback = function() {
                                Menu.find('search').setAsPlaying();
                            };
                            video.createListView().appendTo(Search.youtubeVideosTab.paneView);
                        }
                    });

                    var c = Search.youtubeVideosTab.paneView.data('results-count') || 0;
                    Search.youtubeVideosTab.paneView.data('results-count', c + results.length);

                    /* Add load more row */
                    if (results.length >= Search.itemsPerPage) {
                        Search.createLoadMoreRow(Search.loadMore).appendTo(Search.youtubeVideosTab.paneView);
                    }
                    $('body').removeClass('searching');
                });
                
                break;
            case 'soundcloud-tracks':
                if (Search.lastSoundCloudTracksQuery === q && !loadMore) {
                    return;
                } else {
                    Search.lastSoundCloudTracksQuery = q;
                }

                start = (loadMore) ? Search.soundCloudTracksTab.paneView.data('results-count') + 1 : 1;

                url = 'https://api.soundcloud.com/tracks.json';
                params = {
                    'q': q,
                    'limit': Search.itemsPerPage,
                    'filter': 'streamable',
                    'offset': start,
                    'client_id': SOUNDCLOUD_API_KEY
                };

                /* Clean up destination */
                if (loadMore) {
                    Search.soundCloudTracksTab.paneView.find('.loadMore').remove();
                } else {
                    Search.soundCloudTracksTab.paneView.html('');
                }
                
                $('body').addClass('searching');
                $.getJSON(url, params, function(data) {
                    var results = Search.getVideosFromSoundCloudSearchData(data);
                    $.each(results, function(i, video) {
                        if (video) {
                            video.onPlayCallback = function() {
                                Menu.find('search').setAsPlaying();
                            };
                            video.createListView().appendTo(Search.soundCloudTracksTab.paneView);
                        }
                    });

                    var c = Search.soundCloudTracksTab.paneView.data('results-count') || 0;
                    Search.soundCloudTracksTab.paneView.data('results-count', c + results.length);

                    /* Add load more row */
                    if (results.length >= Search.itemsPerPage) {
                        Search.createLoadMoreRow(Search.loadMore).appendTo(Search.soundCloudTracksTab.paneView);
                    }

                    $('body').removeClass('searching');
                });
                break;
            case 'officialfm-tracks':
                if (Search.lastOfficialfmTracksQuery === q && !loadMore) {
                    return;
                } else {
                    Search.lastOfficialfmTracksQuery = q;
                }

                start = (loadMore) ? Search.officialfmTracksTab.paneView.data('results-count') + 1 : 1;

                url = 'http://api.official.fm/search/tracks/' + escape(q) + '/paginate';
                params = {
                    'format': 'json',
                    'per_page': 30,
                    'page': Math.ceil(start / 30),
                    'key': OFFICIALFM_API_KEY
                };

                /* Clean up destination */
                if (loadMore) {
                    Search.officialfmTracksTab.paneView.find('.loadMore').remove();
                } else {
                    Search.officialfmTracksTab.paneView.html('');
                }

                $('body').addClass('searching');
                $.getJSON(url, params, function(data) {
                    var results = Search.getVideosFromOfficialfmSearchData(data.tracks);
                    $.each(results, function(i, video) {
                        if (video) {
                            video.onPlayCallback = function() {
                                Menu.find('search').setAsPlaying();
                            };
                            video.createListView().appendTo(Search.officialfmTracksTab.paneView);
                        }
                    });

                    var c = Search.officialfmTracksTab.paneView.data('results-count') || 0;
                    Search.officialfmTracksTab.paneView.data('results-count', c + results.length);

                    /* Add load more row */
                    if (data.current >= data.per_page) {
                        Search.createLoadMoreRow(Search.loadMore).appendTo(Search.officialfmTracksTab.paneView);
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
    getVideosFromSoundCloudSearchData: function(data) {
        ret = [];
        $.each(data, function(i, track) {
            ret.push(new Video({
                videoId: track.id,
                title: track.title,
                duration: track.duration,
                type: 'soundcloud'
            }));
        });
        return ret;
    },
    getVideosFromOfficialfmSearchData: function(data) {
        ret = [];
        $.each(data, function(i, track) {
            ret.push(new Video({
                videoId: track.id,
                title: track.title,
                duration: track.length * 1000,
                type: 'officialfm'
            }));
        });
        return ret;
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
                videoId;
            
            if (url.match('videos/(.*)$')) {
                videoId = url.match('videos/(.*)$')[1];
            } else {
                videoId = item.media$group.yt$videoid.$t;
            }

            var video = new Video({
                videoId: videoId,
                title: title,
                type: 'youtube'
            });
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
