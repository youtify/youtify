var Player = { 
	_player: null,
	_playerReady: false,
	_timelineUpdateVar: null,
	_hiddenPlaylist: ['',
		'','','','','','','','','','',
		'','','','','','','sIakSu5VGF0', 'fWucPckXbIw','ypWr6pwoZmI','Tg4u7ko333U',
		'lcOxhH8N3Bo','dJYAenuVnQw','w789CzQdMl0','N2bCc0EGP6U','P0aXY2pM2sA','-kHzZZvsdOE','kz6vq-409Vg','iSF2YHqHJc4','6f8FCHzRcOs','z2Am3aLwu1E',
		'D5fRVm3k1aY','--_KyuZMsnA','6zcrgSB5pkU','sTsVJ1PsnMs','vF74D3kbbTI','','','','','',
		'','','','','','','','','','',
		'', ''], // One for each week :)
	_playbackQuality: ['small', 'medium', 'large', 'hd720', 'hd1080', 'highres'],
	_isFullscreen: false,
	_currentVideoId: null,
	_loadingNewVideo: null, // avoid buffer hang at start
	_playOrderIndex: 0,
	_playOrderList: [],
	_queue: [],

    getCurrentVideoId: function() {
        return Player._currentVideoId;
    },
	
	play: function(videoId, title) {
		if (videoId !== undefined) {
            history.pushState(null, null, '/videos/' + videoId);
            Player._currentVideoId = videoId;
			
			// Make sure currentVideoId is set before assert
			Player.assertPlayerLoaded();
			
			Player._loadingNewVideo = true;
			var quality = new Settings().quality || 'hd720';
			
			try {
				Player._player.loadVideoById(videoId, 0, quality);
			} catch (ex) { 
				console.log(ex);
				Notification.show('An error has occurred with the player. Please reload the page.');
			}
			
			if (title !== undefined) {
				document.title = "Youtify - " + title;
				$('#info .title').text(title);
				
				Notification.announce(title);
			} else {
				Player.loadTitle(videoId);
			}
			InfoPanel.loadFromTag(videoId);
			// avoid buffer hang at start
		} else {
			Player.assertPlayerLoaded();
		}

		Player._player.playVideo();
	},
	
	pause: function() {
		if (!Player._playerReady) return;
		Player.assertPlayerLoaded();
		
		Player._player.pauseVideo();
	},

	playPause: function() {
		if (!Player._playerReady) return;
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
					elem = $(Player._playOrderList[Player._playOrderIndex--]);
				} else {
					return;
				}
			} else {
				elem = $('#results-container li.playing').prev();
			}
			if (elem.hasClass('alternative')) {
				elem = elem.parent().parent().prev();
			}
			if (elem.length > 0)
				elem.play();
		}
	},
	
	next: function() {
		Player.assertPlayerLoaded();
		
		Notification.hide();
		var elem = null; 
		// Queue
		if (Player._queue.length > 0) {
			elem = Player._queue.shift();
			if (elem.originalElem.parent().length > 0) {
				elem = elem.originalElem;
				elem.play();
			} else {
				Player.play(elem.videoId, elem.title);
			}
			return;
		}
		// Playlist
		if (Player._playOrderList.length > 0) {
			if (Player._playOrderIndex+1 <= Player._playOrderList.length) {
				elem = $(Player._playOrderList[Player._playOrderIndex++]);
			} else if (Player._playOrderIndex+1 > Player._playOrderList.length) {
				Player._playOrderList = []
				Player._playOrderIndex = 0;
				return;
			}
		} else {
			elem = $('#results-container li.playing').next();
		}
		if (elem.hasClass('alternative')) {
			elem = elem.parent().parent().next();
		} else if (elem.hasClass('loadMore')) {
			// load more and continue playing
			elem.addClass('loading');
			Search.searchVideos('', true, true);
		}
		if (elem.length > 0) {
			elem.play();
		}
	},
	
	addSiblingsToPlayorder: function(startElem, shuffle) {
		if (startElem === undefined)
			return;
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
				if (item == startElem) {
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
	
	onPlayerStateChange: function(event) {
		//unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5)

		Player._stopTimelineUpdate();
		
		if (event.data != 5) {
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
				if (Player._loadingNewVideo)
					Player._loadingNewVideo = null;
					
				if ($('body').hasClass('paused')) {
					$('body').removeClass('paused');
                }
				$('body').addClass('playing');
				Player._startTimelineUpdate();
				break;
			case 2:
				break;
			case 3:
				// Avoid buffer hang at end (rare)
				var pos = Player._player.getCurrentTime();
				var len = Player._player.getDuration();
				if (pos > len-2.0 && len > 0)
					Player.next();
				break;
			case 5:
				break;
		}
	},
	
	onError: function(event) {
		var messages = {
            2: 'Sorry, the video requested cannot be played. Invalid video ID.',
            100: 'The requested video was not found. The video is removed or marked as private.',
            //101: 'The 101 error code is broadcast when the video requested does not allow playback in the embedded players.',
            //150: 'The 150 error code is broadcast when the video requested does not allow playback in the embedded players.'
            100: 'The rights holder has decided not to share this video on Youtify',
            150: 'The rights holder has decided not to share this video on Youtify'
        }
		var elem = $('.results li.playing'); //$('.results li.playing, .results li.paused')
		if (elem.hasClass('alternative')) {
			if (elem.next()) {
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
		Notification.show(messages[event.data]);
	},
	
	playPrevAlternative: function() {
		var elem = $('.alternatives li.playing');
		if (elem && elem.prev())
			elem.prev().play();
	},
	
	playNextAlternative: function() {
		var elem = $('.alternatives li.playing');
		if (elem && elem.next())
			elem.next().play();
	},
	
	seekForward: function(step) {
		Player.assertPlayerLoaded();
		
		var pos = Player._player.getCurrentTime();
		var len = Player._player.getDuration();
		if (step !== undefined)
			pos += step;
		else 
			pos += 10;
		if (pos > len)
			return;
		Player._player.seekTo(pos, true);ht
	},

	seekBackward: function(step) {
		Player.assertPlayerLoaded();
		
		var pos = Player._player.getCurrentTime();
		if (step !== undefined)
			pos -= step;
		else 
			pos -= 10;
		if (pos < 0)
			pos = 0
		Player._player.seekTo(pos, true);
	},
	
	timelineClick: function(event) {
		if (!Player._playerReady) {
			return;
		}
		
		var len = Player._player.getDuration(); 
		var clickpos = event.pageX - $('#timeline').offset().left;
		var wasMuted = Player._player.isMuted();
		Player._player.mute();
		Player._player.seekTo(len * (clickpos / $('#timeline').width()), true); 
		if (!wasMuted) {
			Player._player.unMute();
		}
		Player._updateTimeline();
	},
	
	_startTimelineUpdate: function() {
		Player.assertPlayerLoaded();
		
		var pos = Player._player.getCurrentTime();
		var len = Player._player.getDuration();
		$('#inner-timeline').show();
		$('#position-label').html(parseInt(pos/60)+':' + ((parseInt(pos%60) <10) ? '0' : '') + parseInt(pos%60));
		$('#end-label').html(parseInt(len/60)+':' + ((parseInt(len%60) <10) ? '0' : '') + parseInt(len%60));
		Player._timelineUpdateVar = setInterval(Player._updateTimeline, 100);
	},

	_updateTimeline: function() { 
		if (!Player.assertPlayerLoaded()) { 
			clearInterval(Player._timelineUpdateVar);
			return;
		}
		var pos = Player._player.getCurrentTime(); 
		var len = Player._player.getDuration(); 
		$('#position-label').html(parseInt(pos/60)+':' + ((parseInt(pos%60) <10) ? '0' : '') + parseInt(pos%60)); 
		$('#inner-timeline').width(pos/len*$('#timeline').width()); 
	},

	_stopTimelineUpdate: function() {
		if (Player._timelineUpdateVar) {
			clearInterval(Player._timelineUpdateVar);
			Player._timelineUpdateVar = null;
		}
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
		// Must set style, not class (and not position).
		Player._isFullscreen = true;
		$('#youtube').css('left',0);
		$('#youtube').css('top',0);
		var width = $(window).width();
		var height = $(window).height() -45;
		$('#youtube').width(width);
		$('#youtube').height(height);
		Player._player.setSize(width, height);
		
		$('#fullscreen').addClass('minimize');
	},
	
	stopFullscreen: function() { 
		Player._isFullscreen = false;
		var width = 230;
		var height = 230;
		$('#youtube').width(width);
		$('#youtube').height(height);
		Player._player.setSize(width, height);

		$(window).resize();
		$('#fullscreen').removeClass('minimize');
	},
	
	volumeUp: function(step) {
		if (!Player._playerReady) {
			return;
		}
		
		var volume = Player._player.getVolume();
		if (step !== undefined)
			volume += step;
		else 
			volume += 5;
		if (volume > 100)
			volume = 100;
		Player._player.setVolume(volume);
	},
	
	volumeDown: function(step) {
		if (!Player._playerReady) {
			return;
		}
		
		var volume = Player._player.getVolume();
		if (step !== undefined)
			volume -= step;
		else 
			volume -= 5;
		if (volume < 0)
			volume = 0;
		Player._player.setVolume(volume);
	},
	
	setVolume: function(volume) {
		if (!Player._playerReady) {
			return;
		}
		
		if (volume === undefined || volume > 100)
			volume = 100;
		if (volume < 0)
			volume = 0;
		Player._player.setVolume(volume);
	},
	
	loadTitle: function(videoId) { 
		var url = "http://gdata.youtube.com/feeds/api/videos?callback=?";
		var params = {
			'alt': 'json-in-script',
			'max-results': 1,
			'prettyprint': true,
			'fields': 'entry(title)',
			'v': 2,
			'q': videoId
		};
		$.getJSON(url, params, function(data) {
			$.each(data.feed.entry, function(i, item) {
				$('#info .title').text(item['title']['$t']);
			}); 
		});
	},
	
	loadIFramePlayer: function() {
		$('#youtube').html(''); // remove old iframe
		var videoId = Player.getCurrentVideoId() || '';
		Player._player = new YT.Player('youtube', {
          height: '230',
          width: '230',
		  videoId: videoId,
		  enablejsapi: 1,
		  modestbranding: 1,
		  origin: document.location.host,
		  playerVars: { 'autoplay': 1, 'controls': 0 },
          events: {
            'onReady': Player.onIFramePlayerReady,
            'onStateChange': Player.onPlayerStateChange,
			'onError': Player.onPlayerError
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
}
