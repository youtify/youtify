function YouTubePlayer() {
    this.prototype = new AbstractPlayer();
    var self = this;
    self.initialized = false;
    self.type = 'youtube';
    
    self.player = null;
    self.view = null;
    self.loadedNewVideo = false;
    self.currentVideo = null;
    self.inFullScreen = false;
    
    /* Init the player */
    self.init = function(callback) {
        var videoId = 'cpvty-isRCk',
            origin = document.location.origin || document.location.protocol + '//' + document.location.host;
        
        if (callback === null || callback === undefined) {
            callback = function() { console.log("YouTube player loaded"); };
        }
        
        /* First argument is a DOM id */
		self.player = new YT.Player('youtube', {
            height: '230',
            width: '230',
            videoId: videoId,
            enablejsapi: 1,
            modestbranding: 1,
            origin: origin,
            playerVars: { 'autoplay': 0, 'controls': 0 },
            events: {
                'onReady': function(data) {
                        self.initialized = true;
                        
                        /* Must be set onReady because the div is replaced with an iFrame */
                        self.view = $('#youtube');
                        
                        if (callback) {
                            callback();
                        }
                    },
                'onStateChange': self.onPlayerStateChange,
                'onError': self.onError
            }
        });
        
        // EventSystem.callEventListeners('player_error', [self, errorMessage]);
    };
    
    /* Hide the player from the UI. Must be callable without prior init */
    self.hide = function() {
        $('#youtube').css('left', '-100000px');
    };

    /* Show the player. Must be callable without prior init */
    self.show = function() {
        $('#youtube').css('left', '0px');
    };
    
    /* Player changed state */
    self.onPlayerStateChange = function(event) {
        if (event === null || event === undefined || 
            event.data === null || event.data === undefined) {
            return;
        }
        /* unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5) */
		switch (event.data) {
			case 0:
                self.currentVideo = null;
				EventSystem.callEventListeners('video_played_to_end', self);
				break;
			case 1: 
                if (self.loadedNewVideo) {
                    self.loadedNewVideo = false;
                    EventSystem.callEventListeners('video_started_playing_successfully', self.currentVideo);
                } else {
                    EventSystem.callEventListeners('backend_played_video', self.currentVideo);
				}
                break;
            case 2:
                EventSystem.callEventListeners('backend_paused_video', self.currentVideo);
                break;
			case 3:
				// Avoid buffer hang at end (rare)
				var pos = self.player.getCurrentTime();
				var len = self.player.getDuration();
				if (pos > len-2.0 && len > 0) {
					EventSystem.callEventListeners('video_played_to_end', self);
                }
				break;
			default:
                break;
		}
    };
    
    /* An error occurred */
    self.onError = function(event) {
        console.log("YouTube player reported an error", event);
		if (self.currentVideo) {
            EventSystem.callEventListeners('video_failed_to_play', self.currentVideo);
        }
	};
    
    /* Start (or if video is null resume) playback of a video */
    self.play = function(video) {
        var quality = new Settings().quality || 'hd720';
        
        if (video) {
            self.loadedNewVideo = true;
            self.currentVideo = video;
            self.player.loadVideoById(video.videoId, 0, quality);
        } else {
            self.player.playVideo();
        }
    };
    
    /* Stops the current video */
    self.stop = function() {
        if (self.player) {
            self.player.stopVideo();
            self.currentVideo = null;
        }
    };
    
    /* Pauses the current video */
    self.pause = function() {
        self.player.pauseVideo();
    };
    
    /* Enter fullScreen (must respect self.show() & self.hide()) */
    self.fullScreenOn = function() {
        var width = $(window).width(),
            height = $(window).height() - $('#bottom').outerHeight();
        
        if (self.view === null || self.view.left < 0) {
            return;
        }

		/* Must set style, not class */
		$('#left .players').css('top',0);
		self.view.width(width);
		self.view.height(height);
        self.inFullScreen = true;
    };
    
    /* Exit fullScreen (must respect self.show() & self.hide()) */
    self.fullScreenOff = function() {
        var width = 230,
            height = 230;
        if (self.view === null || self.view.left < 0) {
            return;
        }
        
		/* Must set style, not class */
		$('#left .players').removeAttr('style');
		self.view.width(width);
		self.view.height(height);
        self.inFullScreen = false;
    };
    
    /* Set volume (0-100) */
    self.setVolume = function(volume) {
        self.player.setVolume(volume);
    };
    
    /* Get volume (0-100) */
    self.getVolume = function() {
        return self.player.getVolume();
    };
    
    /* Seek to time (seconds) in video */
    self.seekTo = function(time) {
        if (self.currentVideo) {
            self.player.seekTo(time, true);
        }
    };
    
    /* Returns the current playback position in seconds */
    self.getCurrentPlaybackTime = function() {
        if (self.currentVideo) {
            return self.player.getCurrentTime();
        } else {
            return 0;
        }
    };
    
    /* Returns the length of the video in seconds */
    self.getTotalPlaybackTime = function() {
        if (self.currentVideo) {
            return self.player.getDuration();
        } else {
            return 0;
        }
    };
}