var BottomPanel = {
    init: function() {
        var $badge = $('#bottom .info .badge');

        // TITLE
        EventSystem.addEventListener('video_info_fetched', function(info) {
            BottomPanel.setTitleText(info.title);
        });

        EventSystem.addEventListener('flattr_thing_for_twitter_account_found', function(info) {
            $badge.text('flattrable').show();
        });
        EventSystem.addEventListener('flattr_thing_for_track_found', function(info) {
            $badge.text('flattrable').show();
        });
        EventSystem.addEventListener('flattr_thing_for_uploader_found', function(info) {
            $badge.text('flattrable').show();
        });
        EventSystem.addEventListener('video_started_playing_successfully', function(info) {
            $badge.hide();
        });

        $('#bottom .info .title').click(function() {
            $(this).arrowPopup('#video-info-popup', 'down');
        });

        // CONTROLS
        $('#bottom .controls .playpause').click(player.playPause);
        $('#bottom .controls .next').click(player.next);
        $('#bottom .controls .prev').click(player.prev);
        
        // FULLSCREEN
        $('#bottom .fullscreen').click(function(event) {
            $(this).toggleClass('on');
            player.toggleFullScreen(event);
        });
        
        // SHUFFLE
        $('#bottom .shuffle').click(function() {
            $(this).toggleClass('on');
        });
    },
    setTitleText: function(titleText) {
        $('#bottom .info .title .text')
            .text(titleText)
            .attr('title', titleText);
    }
};
