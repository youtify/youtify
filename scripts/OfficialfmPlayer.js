function OfficialfmPlayer() {
    this.prototype = new AbstractPlayer;
    var self = this;
    self.initialized = false;
    self.type = 'officialfm';
    self.video = null;
    self.volume = 100;
    self.mp3_url = 'http://cdn.official.fm/'

    /* Init the player */
    self.init = function(callback) {
        soundManager.onready(function() {
            self.initialized = true;
            if (callback) {
                callback(self);
            }
        });
    };
    
    /* Hide the player from the UI. Must be callable without prior init */
    self.hide = function() {
        $('#officialfm').hide();
    };

    /* Show the player. Must be callable without prior init */
    self.show = function() {
        $('#officialfm').show();
    };
    
    /* Start (or if video is null resume) playback of a video */
    self.play = function(video) {
        if (video) {
            self.video = video;
            soundManager.stopAll();
            soundManager.createSound({
                id: video.videoId,
                url: 'http://cdn.official.fm/mp3s/' + Math.floor(video.videoId / 1000) + '/' + video.videoId + '.mp3',
                volume: self.volume,
                onplay: function() {
                    EventSystem.callEventListeners('video_started_playing_successfully', self.video);
                },
                onresume: function() {
                    EventSystem.callEventListeners('backend_played_video', self.video);
                },
                onpause: function() {
                    EventSystem.callEventListeners('backend_paused_video', self.video);
                },
                onfinish: function() {
                    soundManager.destroySound('soundcloud');
                    EventSystem.callEventListeners('video_played_to_end', self);
                }
            });
            soundManager.play(self.video.videoId);
        } else {
            soundManager.play(self.video.videoId);
        }
    };
    
    /* Stops the current video */
    self.stop = function() {
        self.video = null;
        soundManager.stopAll();
    };
    
    /* Pauses the current video */
    self.pause = function() {
        soundManager.pause(self.video.videoId);
    };
    
    /* Enter fullScreen (must respect self.show() & self.hide()) */
    self.fullScreenOn = function() {
        //        throw 'Error in AbstractPlayer: This method must be overridden.';
    };
    
    /* Exit fullScreen (must respect self.show() & self.hide()) */
    self.fullScreenOff = function() {
        //        throw 'Error in AbstractPlayer: This method must be overridden.';
    };
    
    /* Set volume (0-100) */
    self.setVolume = function(volume) {
        self.volume = volume;
        if (self.video) {
            soundManager.setVolume(self.video.videoId, volume);
        }
    };
    
    /* Get volume (0-100) */
    self.getVolume = function() {
        return self.volume;
    };
    
    /* Seek to time (seconds) in video */
    self.seekTo = function(time) {
        soundManager.setPosition(self.video.videoId, time * 1000);
    };
    
    /* Returns the current playback position in seconds */
    self.getCurrentPlaybackTime = function() {
        if (!self.video) {
            return 0;
        }
        var sound = soundManager.getSoundById(self.video.videoId);
        if (sound) {
            return sound.position / 1000.0;
        } else {
            return 0;
        }
    };
    
    /* Returns the length of the video in seconds */
    self.getTotalPlaybackTime = function() {
        if (!self.video) {
            return 0;
        }
        var sound = soundManager.getSoundById(self.video.videoId);
        if (sound) {
            return sound.durationEstimate / 1000.0;
        } else {
            return 0;
        }
    };
}
