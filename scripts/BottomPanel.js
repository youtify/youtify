var BottomPanel = {
    init: function() {
        // TITLE
        EventSystem.addEventListener('video_info_fetched', function(info) {
            BottomPanel.setTitleText(info.title);
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
