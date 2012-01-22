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
            if (Queue.playPrev()) {
                return;
            }
		}
	},
	
	next: function() {
		Player.assertPlayerLoaded();
		
		var elem = null; 
		// Queue
		if (Queue.playNext()) {
			return;
		}
		
        elem = $('#right .playing').next();
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
	
	addSiblingsToPlayorder: function(startElem) {
        if (startElem === undefined) {
			return;
        }
		var list = [];
        
		if ($('#bottom .shuffle').hasClass('on')) {
            /* Add all videos */
            $(startElem).siblings('.video').each(function(index, item) {
                list.push($(item).data('model'));
            });
			$.shuffle(list);
		} else {
            /* Add videos after this */
            $(startElem).nextAll('.video').each(function(index, item) {
                list.push($(item).data('model'));
            });
        }
        list.unshift($(startElem).data('model'));
        Queue.setAutoQueue(list);
	},
    
    _startedPlayingVideoSuccessfully: function() {
        var video = new Video(Player._currentVideoId);

        if (Search.alternatives !== undefined) {
            EventSystem.callEventListeners('alternative_started_playing_successfully', video);
        }

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
            2: 'Could not play video: invalid video id',
            //100: 'The requested video was not found. The video is removed or marked as private.',
            //101: 'The 101 error code is broadcast when the video requested does not allow playback in the embedded players.',
            //150: 'The 150 error code is broadcast when the video requested does not allow playback in the embedded players.'
            100: 'Could not play video',
            150: 'Could not play video'
        };
        var message = messages[event.data];
		var elem = $('#right .video.playing:visible');
		var video = elem.data('model');

        if (video) {
            elem.addClass('alternative');
            Search.findAlternative(video, function(alt) {
                if (alt === false) {
                    Player.next();
                } else {
                    Player.play(alt);
                }
            });
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
		var $youtubePlayerElem = $('#left .players'),
            width = $(window).width(),
            height = $(window).height() - $('#bottom').outerHeight();

        $('#top, #right').hide();
        
		// Must set style, not class (and not position).
		$youtubePlayerElem.css('left',0);
		$youtubePlayerElem.css('top',0);
		$youtubePlayerElem.width(width);
		$youtubePlayerElem.height(height);

		Player._isFullscreen = true;
		Player._player.setSize(width, height);
	},
	
	stopFullscreen: function() { 
        var $youtubePlayerElem = $('#left .players');
		var width = 230;
		var height = 230;

        $('#top, #right').show();
        
		$youtubePlayerElem.removeAttr('style');
		$youtubePlayerElem.width(width);
		$youtubePlayerElem.height(height);

		Player._isFullscreen = false;
		Player._player.setSize(width, height);
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
        console.log(Player._player);
	},

	onIFramePlayerReady: function(event) {
		Player._playerReady = true;
        //Player._player = event.target;
        console.log(event);
	},
	
	assertPlayerLoaded: function() {
		if (Player._player === undefined || Player._player === null) { 
			Player._playerReady = false;
			
			console.log("Reloading player");
			Player.loadIFramePlayer();
		}
		return Player._playerReady;
	}
};
