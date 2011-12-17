var BottomPanel = {
    init: function() {
        // TITLE
        EventSystem.addEventListener('video_info_fetched', function(info) {
            $('#bottom .info .title').text(info.title);
        });

        // CONTROLS
        $('#bottom .controls .playpause').click(Player.playPause);
        $('#bottom .controls .next').click(Player.next);
        $('#bottom .controls .prev').click(Player.prev);
        
        // FULLSCREEN
        $('#bottom .fullscreen').click(function() {
            Player.toggleFullscreen();
        });
    }
};
