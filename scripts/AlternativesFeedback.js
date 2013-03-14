
AlternativesFeedback = {
    timer: null,
    init: function() {
        var self = AlternativesFeedback;
        $('#alternative-video-popup .no').click(function() {
            var video = Search.originalTrack,
                alternative = player.currentVideo;

            $.post('/api/alternatives/' + alternative.type + '/' + alternative.videoId,
                { 'replacement_for_id': video.videoId, 'replacement_track_type': video.type, 'vote': -1 }
            );

            player.findAndPlayAlternative(Search.originalTrack);
            self.close();
        });

        $('#alternative-video-popup .yes').click(function() {
            var video = Search.originalTrack,
                alternative = player.currentVideo;

            $.post('/api/alternatives/' + alternative.type + '/' + alternative.videoId,
                { 'replacement_for_id': video.videoId, 'replacement_track_type': video.type, 'vote': 1 }
            );

            self.close();
        });
        
        EventSystem.addEventListener('video_started_playing_successfully', function(video) {
            self.close();
            if (video.listView && video.listView.hasClass('alternative')) {
                self.showPopup(video);
            }
        });
    },
    showPopup: function(video) {
        var self = AlternativesFeedback;
        if (self.timer !== null) {
            clearTimeout(self.timer);
            self.timer = null;
        }
        $('#bottom .info .title').arrowPopup('#alternative-video-popup', 'down', true);
        self.timer = setTimeout(self.close, 30 * 1000);
    },
    close: function() {
        var self = AlternativesFeedback;
        $('#alternative-video-popup .close').click();
        if (self.timer !== null) {
            clearTimeout(self.timer);
            self.timer = null;
        }
    }
};