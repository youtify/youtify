function AbstractPlayer() {
    //this.prototype = new AbstractPlayer;
    var self = this;
    self.initialized = false;
    self.type = 'abstract';
    
    /* Init the player */
    self.init = function(callback) {
        throw 'Error in AbstractPlayer: This method must be overridden.';
        
        /*if (success) {
            self.initialized = true;
            callback(self);
        } else {
            EventSystem.callEventListeners('player_error', self);
        }*/
    };
    
    /* Hide the player from the UI. Must be callable without prior init */
    self.hide = function() {
        throw 'Error in AbstractPlayer: This method must be overridden.';
    };

    /* Show the player. Must be callable without prior init */
    self.show = function() {
        throw 'Error in AbstractPlayer: This method must be overridden.';
    };
    
    /* Start (or if video is null resume) playback of a video */
    self.play = function(video) {
        throw 'Error in AbstractPlayer: This method must be overridden.';
        
        /*if (success) {
            EventSystem.callEventListeners('video_started_playing_successfully', video);
        } else {
            EventSystem.callEventListeners('video_failed_to_play', video);
        }
        // On video end
        EventSystem.callEventListeners('video_played_to_end', self);*/
    };
    
    /* Pauses the current video */
    self.pause = function() {
        throw 'Error in AbstractPlayer: This method must be overridden.';
    };
    
    /* Enter fullScreen (must respect self.show() & self.hide()) */
    self.fullScreenOn = function() {
        throw 'Error in AbstractPlayer: This method must be overridden.';
    };
    
    /* Exit fullScreen (must respect self.show() & self.hide()) */
    self.fullScreenOff = function() {
        throw 'Error in AbstractPlayer: This method must be overridden.';
    };
    
    /* Set volume (0-100) */
    self.setVolume = function(volume) {
        throw 'Error in AbstractPlayer: This method must be overridden.';
    };
    
    /* Get volume (0-100) */
    self.getVolume = function() {
        throw 'Error in AbstractPlayer: This method must be overridden.';
    };
    
    /* Seek to time (seconds) in video */
    self.seekTo = function(time) {
        throw 'Error in AbstractPlayer: This method must be overridden.';
    };
    
    /* Returns the current playback position in seconds */
    self.getCurrentPlaybackTime = function() {
        throw 'Error in AbstractPlayer: This method must be overridden.';
    };
    
    /* Returns the length of the video in seconds */
    self.getTotalPlaybackTime = function() {
        throw 'Error in AbstractPlayer: This method must be overridden.';
    };
}