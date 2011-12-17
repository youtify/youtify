function player_Init() {
    Player.init();
}

var Player = { 
	_player: null,
	_playerReady: false,
	_hiddenPlaylist: ['',
		'','','','','','','','','','',
		'','','','','','','sIakSu5VGF0', 'fWucPckXbIw','ypWr6pwoZmI','Tg4u7ko333U',
		'lcOxhH8N3Bo','dJYAenuVnQw','w789CzQdMl0','N2bCc0EGP6U','P0aXY2pM2sA','-kHzZZvsdOE','kz6vq-409Vg','iSF2YHqHJc4','6f8FCHzRcOs','z2Am3aLwu1E',
		'D5fRVm3k1aY','--_KyuZMsnA','6zcrgSB5pkU','sTsVJ1PsnMs','vF74D3kbbTI','6_W_xLWtNa0','_Y-suQWFOfg','xNidwV6OZ3w','wp43OdtAAkM','2aljlKYesT4',
		'P9mwELXPGbA','loWXMtjUZWM','PJQVlVHsFF8','cBFANonCPpk','0qGTjIcVDAU','lp_PIjc2ga4','','','','',
		'', ''], // One for each week :)
	_playbackQuality: ['small', 'medium', 'large', 'hd720', 'hd1080', 'highres'],
	_isFullscreen: false,
	_lastVideoId: null,
	_currentVideoId: null,
	_loadingNewVideo: null, // avoid buffer hang at start
	_playOrderIndex: 0,
	_playOrderList: [],
	_queue: [],
    
    init: function() {
        
    },

    getCurrentVideoId: function() {
        return Player._currentVideoId;
    },
	
	play: function(video) {
        var videoId;
        if (video) {
            if (typeof video === typeof 'string') {
                videoId = video;
            } else {
                videoId = video.videoId;
            }
        }
            
        if (!youTubeApiReady) {
            setTimeout(function() {
                Player.play(video);
            }, 1000);
            return;
        }

        if (Player._lastVideoId !== Player._currentVideoId) {
            FatBar.clear();
        }

        $('#bottom .info, #bottom .share-wrapper').show();

		if (videoId !== undefined) {
            history.pushState(null, null, '/videos/' + videoId);
            Player._currentVideoId = videoId;
			var quality = new Settings().quality || 'hd720';
			Player._loadingNewVideo = true;
			
			// Make sure currentVideoId is set before assert
			if (Player.assertPlayerLoaded()) {
				try {
					Player._player.loadVideoById(videoId, 0, quality);
				} catch (ex) { 
					console.log(ex);
					Notification.say('An error has occurred with the player. Please reload the page.');
				}
			}
			
			// avoid buffer hang at start
		} else {
			Player.assertPlayerLoaded();
		}

        if (Player._player.playVideo) {
            Player._player.playVideo();
        }
	},
	
	pause: function() {
		if (!Player._playerReady) {
            return;
        }
		Player.assertPlayerLoaded();
		
		Player._player.pauseVideo();
	},

	playPause: function() {
		if (!Player._playerReady) {
            return;
        }
		Player.assertPlayerLoaded();

		if (Player._player.getPlayerState() === 1) {
			Player.pause();
		} else {
			Player.play();
		}
	},
	
	prev: function() {
		Player.assertPlayerLoaded();
		
		if (Player._player.getCurrentTime() > 3) {
			Player._player.seekTo(0);
		} else {
			var elem = null; 
			if (Player._playOrderList.length > 0) {
				if (Player._playOrderIndex-1 >= 0) {
					elem = $(Player._playOrderList[Player._playOrderIndex -= 1]);
				} else {
					return;
				}
			} else {
				elem = $('#results-container li.playing').prev();
			}
			if (elem.hasClass('alternative')) {
				elem = elem.parent().parent().prev();
			}
			if (elem.length > 0) {
				elem.play();
            }
		}
	},
	
	next: function() {
		Player.assertPlayerLoaded();
		
		var elem = null; 
		// Queue
		if (Player._queue.length > 0) {
			elem = Player._queue.shift();
			if (elem.originalElem.parent().length > 0) {
				elem = elem.originalElem;
				elem.play();
			} else {
				Player.play(elem.data('model'));
			}
			return;
		}
		// Playlist
		if (Player._playOrderList.length > 0) {
			if (Player._playOrderIndex+1 <= Player._playOrderList.length) {
				elem = $(Player._playOrderList[Player._playOrderIndex += 1]);
			} else if (Player._playOrderIndex+1 > Player._playOrderList.length) {
				Player._playOrderList = [];
				Player._playOrderIndex = 0;
				return;
			}
		} else {
			elem = $('#right .playing').next();
		}
		if (elem.hasClass('alternative')) {
			elem = elem.parent().parent().next();
		} else if (elem.hasClass('loadMore')) {
			// load more and continue playing
			elem.addClass('loading');
			Search.searchVideos('', true, true);
		}
		if (elem.length > 0) {
			elem.data('model').play();
		}
	},
	
	addSiblingsToPlayorder: function(startElem, shuffle) {
		if (startElem === undefined) {
			return;
        }
		Player._playOrderList = [];
		Player._playOrderIndex = 0;
		if (shuffle) {
			// add all siblings to the list
			$(startElem).siblings().each(function(index, item) {
				Player._playOrderList.push(item);
			});
			$.shuffle(Player._playOrderList);
			// find the start elem and move it to the top of the list
			$.each(Player._playOrderList, function(index, item) {
				if (item === startElem) {
					Player._playOrderList.splice(index, 1);
					Player._playOrderList.unshift(startElem);
				}
			});
		} else {
			var elem = startElem;
			while(elem.length > 0) {
				Player._playOrderList.push(elem);
				elem = $(elem).next();
			}
		}
	},
	
	addToPlayOrder: function(elem) {
		Player._queue.push({ 
			videoId: elem.data('videoId'), 
			title: elem.find('.title').text(), 
			originalElem: elem 
		});
	},

    _startedPlayingVideoSuccessfully: function() {
        var video = new Video(Player._currentVideoId);
        EventSystem.callEventListeners('video_started_playing_successfully', video);
    },

	onPlayerStateChange: function(event) {
		//unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5)

		Timeline.stop();
		
		if (event.data !== 5) {
			if ($('body').hasClass('playing')) {
				$('body').removeClass('playing');
            }
			$('body').addClass('paused');
		}
			
		switch (event.data) {
			case -1:
				// avoid buffer hang at start
				if (Player._loadingNewVideo){
					Player._loadingNewVideo = null;
					Player.play();
				}
				break;
			case 0: // ended
				Player.next();
				break;
			case 1: 
				// avoid buffer hang at start
				if (Player._loadingNewVideo) {
					Player._loadingNewVideo = null;
                }
				if ($('body').hasClass('paused')) {
					$('body').removeClass('paused');
                }
				$('body').addClass('playing');
				Timeline.start();
                if (Player._lastVideoId !== Player._currentVideoId) {
                    Player._startedPlayingVideoSuccessfully();
                    Player._lastVideoId = Player._currentVideoId;
                }
				break;
			case 2:
				break;
			case 3:
				// Avoid buffer hang at end (rare)
				var pos = Player._player.getCurrentTime();
				var len = Player._player.getDuration();
				if (pos > len-2.0 && len > 0) {
					Player.next();
                }
				break;
			case 5:
				break;
		}
	},
	
	onError: function(event) {
		var messages = {
            2: 'Sorry, the video requested cannot be played. Invalid video ID.',
            //100: 'The requested video was not found. The video is removed or marked as private.',
            //101: 'The 101 error code is broadcast when the video requested does not allow playback in the embedded players.',
            //150: 'The 150 error code is broadcast when the video requested does not allow playback in the embedded players.'
            100: 'The rights holder has decided not to share this video on Youtify',
            150: 'The rights holder has decided not to share this video on Youtify'
        };
		var elem = $('#right .playing');
        // No playitem found
        if (elem.length === 0) {
            Notification.say(messages[event.data]);
            return;
        }
		if (elem.hasClass('alternative')) {
			if (elem.next().length > 0) {
				elem.next().play();
			} else {
				Player.next();
			}
			elem.remove();
			return;
		}
		if (elem.hasClass('fake') && elem.find('ul').length) {
			elem.find('li:first-child').play();
			return;
		}
		elem.addClass('disabled');
		Search.findAndPlayAlternative(elem);
		Notification.say(messages[event.data]);
	},
	
	playPrevAlternative: function() {
		var elem = $('.alternatives .playing');
		if (elem && elem.prev()) {
			elem.prev().play();
        }
	},
	
	playNextAlternative: function() {
		var elem = $('.alternatives .playing');
		if (elem && elem.next()) {
			elem.next().play();
        }
	},
	
	seekForward: function(step) {
		Player.assertPlayerLoaded();
		
		var pos = Player._player.getCurrentTime();
		var len = Player._player.getDuration();
		if (step !== undefined) {
			pos += step;
		} else {
			pos += 10;
        }
		if (pos > len) {
			return;
        }
		Player._player.seekTo(pos, true);
	},

	seekBackward: function(step) {
		Player.assertPlayerLoaded();
		
		var pos = Player._player.getCurrentTime();
		if (step !== undefined) {
			pos -= step;
		} else {
			pos -= 10;
        }
		if (pos < 0) {
			pos = 0;
        }
		Player._player.seekTo(pos, true);
	},
	
	toggleFullscreen: function() { 
		if (Player._isFullscreen) {
			Player.stopFullscreen();
		} else {
			Player.startFullscreen();
		}
	},
	
	startFullscreen: function() { 
		if (!Player._playerReady) {
			return;
		}
        var $youtubePlayerElem = $('#left .players .youtube');
		// Must set style, not class (and not position).
		Player._isFullscreen = true;
		$($youtubePlayerElem).css('left',0);
		$($youtubePlayerElem).css('top',0);
		var width = $(window).width();
		var height = $(window).height() -45;
		$($youtubePlayerElem).width(width);
		$($youtubePlayerElem).height(height);
		Player._player.setSize(width, height);
		
		$('#bottom .fullscreen').addClass('minimize'); // TODO create elem in index.html
	},
	
	stopFullscreen: function() { 
		Player._isFullscreen = false;
        var $youtubePlayerElem = $('#left .players .youtube');
		var width = 230;
		var height = 230;
		$($youtubePlayerElem).width(width);
		$($youtubePlayerElem).height(height);
		Player._player.setSize(width, height);

		$(window).resize();
		$('#bottom .fullscreen').removeClass('minimize'); // TODO create elem in index.html
	},
	
	volumeUp: function(step) {
		if (!Player._playerReady) {
			return;
		}
		
		var volume = Player._player.getVolume();
		if (step !== undefined) {
			volume += step;
		} else {
			volume += 5;
        }
		if (volume > 100) {
			volume = 100;
        }
		Player._player.setVolume(volume);
	},
	
	volumeDown: function(step) {
		if (!Player._playerReady) {
			return;
		}
		
		var volume = Player._player.getVolume();
		if (step !== undefined) {
			volume -= step;
		} else {
			volume -= 5;
        }
		if (volume < 0) {
			volume = 0;
        }
		Player._player.setVolume(volume);
	},
	
	setVolume: function(volume) {
		if (!Player._playerReady) {
			return;
		}
		
		if (volume === undefined || volume > 100) {
			volume = 100;
        }
		if (volume < 0) {
			volume = 0;
        }
		Player._player.setVolume(volume);
	},

	loadIFramePlayer: function() {
        $youtubePlayerElem = $('#left .players .youtube');
        $youtubePlayerElem.html(''); // remove old iframe

		var videoId = Player.getCurrentVideoId() || '';
		var origin = document.location.origin || document.location.protocol + '//' + document.location.host;
		Player._player = new YT.Player('youtube', {
          height: '230',
          width: '230',
		  videoId: videoId,
		  enablejsapi: 1,
		  modestbranding: 1,
		  origin: origin,
		  playerVars: { 'autoplay': 1, 'controls': 0 },
          events: {
            'onReady': Player.onIFramePlayerReady,
            'onStateChange': Player.onPlayerStateChange,
			'onError': Player.onError
          }
        });
	},

	onIFramePlayerReady: function(event) {
		Player._playerReady = true;
	},
	
	assertPlayerLoaded: function() {
		if (Player._player === undefined || Player._player === null || Player._player.getPlayerState === undefined) { 
			Player._playerReady = false;
			
			console.log("Reloading player");
			Player.loadIFramePlayer();
		}
		return Player._playerReady;
	}
};
