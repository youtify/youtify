
var Search = {
    searchTimeoutHandle: null,
    currentQuery: '',
    alternatives: undefined,
    lastVideosSearchQuery: undefined,
    lastPlaylistsSearchQuery: undefined,
    lastSoundCloudTracksQuery: undefined,
    itemsPerPage: 30,
    lastQueries: {},
    tabs: null,
    $rightView: null,

    init: function() {
        Search.$rightView = $('#right .search');
        Search.tabs = new Tabs(Search.$rightView, {
            'youtube-videos': Search.searchCurrentQuery,
            'soundcloud-tracks': Search.searchCurrentQuery,
            'officialfm-tracks': Search.searchCurrentQuery,
            'youtify-playlists': Search.searchCurrentQuery,
            'youtify-users': Search.searchCurrentQuery
        });

        /* Search on key up */
        $('#top .search input').keyup(function(event) {
            $('#left, #right').removeClass('focused');
            $('#top .search').addClass('focused');

            var i,
                deadKeys = [9, 16, 17, 18, 37, 38, 39, 40];
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

        (function() {
            var $search = $('#right .search');
            var timeout;
            $('#right .search').scroll(function(event) {
                if (timeout) {
                    clearTimeout(timeout);
                }
                timeout = setTimeout(function() {
                    var $pane = $('#right .search .pane.selected');
                    if ($search.scrollTop() >= ($pane.height() - $search.height()) && $pane.hasClass('has-more')) {
                        Search.search(Search.currentQuery, true);
                    }
                }, 100);
            });
        }());

        $('#top .search button').click(function() {
            Search.search($.trim($('#top .search input').val()));
        });
        EventSystem.addEventListener('video_started_playing_successfully', function() {
            Search.alternatives = undefined;
        });
    },
    searchCurrentQuery: function() {
        Search.search(Search.currentQuery);
    },
    show: function() {
        Menu.deSelect();
        Search.$rightView.show();
        history.pushState(null, null, encodeURI('/search?q=' + Search.currentQuery));
    },
    search: function(q, loadMore) {
        if (q.length === 0) {
            return;
        }
        Utils.scrollRight();
        
        var url = null,
            c = null,
            start = null,
            type = null,
            params = null;

        Search.currentQuery = q;
        Search.show();

        if (Search.tabs.$selectedTab) {
            type = Search.tabs.$selectedTab.attr('rel');
        } else {
            type = 'youtube-videos';
        }

        if (Search.lastQueries.hasOwnProperty(type) && Search.lastQueries[type] === q && !loadMore) {
            return;
        }

        Search.lastQueries[type] = q;

        if (!Search.tabs.$selectedTab) {
            Search.tabs.select(type);
        }

        if (!loadMore) {
            Search.tabs.$selectedPane.html('');
        }

        start = (loadMore) ? Search.tabs.$selectedPane.data('results-count') + 1 : 1;

        c = Search.tabs.$selectedPane.data('results-count') || 0;

        EventSystem.callEventListeners('new_search_executed', q);

        switch (type) {
            case 'youtube-videos':
                url = 'http://gdata.youtube.com/feeds/api/videos?callback=?';
                params = {
                    'alt': 'json-in-script', 'max-results': Search.itemsPerPage,
                    'start-index': start,
                    'format': 5,
                    'q': q
                };

                LoadingBar.show();
                $.getJSON(url, params, function(data) {
                    var results = Search.getVideosFromYouTubeSearchData(data);
                    $.each(results, function(i, video) {
                        if (video) {
                            video.createListView().appendTo(Search.tabs.$selectedPane);
                        }
                    });

                    Search.tabs.$selectedPane.data('results-count', c + results.length);

                    if (results.length >= Search.itemsPerPage) {
                        Search.tabs.$selectedPane.addClass('has-more');
                    } else {
                        Search.tabs.$selectedPane.removeClass('has-more');
                    }
                    LoadingBar.hide();
                });

                break;
            case 'soundcloud-tracks':
                url = 'https://api.soundcloud.com/tracks.json';
                params = {
                    'q': q,
                    'limit': Search.itemsPerPage,
                    'filter': 'streamable',
                    'offset': start,
                    'client_id': SOUNDCLOUD_API_KEY
                };

                LoadingBar.show();
                $.getJSON(url, params, function(data) {
                    var results = Search.getVideosFromSoundCloudSearchData(data);
                    $.each(results, function(i, video) {
                        if (video) {
                            video.createListView().appendTo(Search.tabs.$selectedPane);
                        }
                    });

                    Search.tabs.$selectedPane.data('results-count', c + results.length);

                    if (results.length >= Search.itemsPerPage) {
                        Search.tabs.$selectedPane.addClass('has-more');
                    } else {
                        Search.tabs.$selectedPane.removeClass('has-more');
                    }

                    LoadingBar.hide();
                });
                break;
            case 'officialfm-tracks':
                url = 'http://api.official.fm/tracks/search?q=' + escape(q) + '&api_version=2&fields=cover';
                params = {
                    'format': 'json',
                    'per_page': 30,
                    'page': Math.ceil(start / 30),
                    'key': OFFICIALFM_API_KEY
                };

                LoadingBar.show();
                $.getJSON(url, params, function(data) {
                    var results = Search.getVideosFromOfficialfmSearchData(data.tracks);
                    $.each(results, function(i, video) {
                        if (video) {
                            video.createListView().appendTo(Search.tabs.$selectedPane);
                        }
                    });

                    Search.tabs.$selectedPane.data('results-count', c + results.length);

                    if (data.current >= data.per_page) {
                        Search.tabs.$selectedPane.addClass('has-more');
                    } else {
                        Search.tabs.$selectedPane.removeClass('has-more');

                    }

                    LoadingBar.hide();
                });
                break;
            case 'youtify-users':
                url = '/api/search/users';
                params = {
                    'q': q,
                    'per_page': 30,
                    'page': Math.ceil(start / 30)
                };

                LoadingBar.show();
                $.get(url, params, function(data) {
                    var results = data;

                    $.each(results, function(i, user) {
                        new User(user).getSmallView().appendTo(Search.tabs.$selectedPane);
                    });

                    Search.tabs.$selectedPane.data('results-count', c + results.length);

                    LoadingBar.hide();
                });
                break;
            case 'youtify-playlists':
                url = '/api/search/playlists';
                params = {
                    'q': q,
                    'per_page': 30,
                    'page': Math.ceil(start / 30)
                };

                LoadingBar.show();
                $.get(url, params, function(data) {
                    var results = data;

                    $.each(results, function(i, playlist) {
                        new Playlist(playlist.title, playlist.videos, playlist.remoteId, playlist.owner, playlist.isPrivate).getSearchView().appendTo(Search.tabs.$selectedPane);
                    });

                    Search.tabs.$selectedPane.data('results-count', c + results.length);

                    LoadingBar.hide();
                });
                break;
        }
    },
    onPlayCallback: function() {
        Menu.setAsNotPlaying();
    },
    getVideosFromSoundCloudSearchData: function(data) {
        ret = [];
        $.each(data, function(i, track) {
            var buyLinks = track.purchase_url ? [track.purchase_url] : null;
            ret.push(new Video({
                parent: 'search',
                onPlayCallback: Search.onPlayCallback,
                videoId: track.id,
                title: track.title,
                duration: track.duration,
                buyLinks: buyLinks,
                uploaderUsername: track.user.permalink,
                type: 'soundcloud',
                artworkURL: track.artwork_url
            }));
        });
        return ret;
    },
    getVideosFromOfficialfmSearchData: function(data) {
        ret = [];
        $.each(data, function(i, track) {
            track = track.track;
            var title = track.title.indexOf(track.artist) > -1 ? 
                    track.title : 
                    track.artist + ' - ' + track.title,
                buyLinks = track.purchase_url ? [track.buy_url] : null,
                id = track.page.split('/');
            id = id[id.length-1];
            ret.push(new Video({
                parent: 'search',
                onPlayCallback: Search.onPlayCallback,
                videoId: id,
                title: title,
                duration: track.duration * 1000,
                buyLinks: buyLinks,
                uploaderUsername: track.project.name,
                type: 'officialfm',
                artworkURL: track.cover.urls.large
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
                parent: 'search',
                onPlayCallback: Search.onPlayCallback,
                videoId: videoId,
                title: title,
                uploaderUsername: item.author[0].name.$t,
                type: 'youtube',
                artworkURL: item.media$group.media$thumbnail.length > 1 ? item.media$group.media$thumbnail[1].url : null
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
            results = Search.getVideosFromYouTubeSearchData(data, true);
            callback(results);
        });
    }
};
