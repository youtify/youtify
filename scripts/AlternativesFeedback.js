
AlternativesFeedback = {
    init: function() {
        var self = this;
        $('#alternative-video-popup .no').click(function() {
            player.findAndPlayAlternative(player.currentVideo);
            $('#alternative-video-popup .close').click();
        });
        $('#alternative-video-popup .yes').click(function() {
            $('#alternative-video-popup .close').click();
        });
        EventSystem.addEventListener('video_started_playing_successfully', function(video) {
            if (video.listView && video.listView.hasClass('alternative')) {
                self.showPopup(video);
            }
        });
    },
    showPopup: function(video) {
        $('#bottom .info .title').arrowPopup('#alternative-video-popup', 'down', true);
    }
};