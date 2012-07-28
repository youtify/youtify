var BottomPanel = {
    init: function() {
        // TITLE
        EventSystem.addEventListener('video_info_fetched', function(info) {
            BottomPanel.setTitleText(info.title);
        });

        $('#bottom .info .title').click(function() {
            if (player.currentVideo) {
                $(this).arrowPopup('#video-info-popup', 'down');
            }
        });
        $('#bottom .info .title').bind('contextmenu', function(event) {
            if (player.currentVideo) {
                showResultsItemContextMenu(event, player.currentVideo.listView);
            }
            return false;
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
        $('#bottom .info .title')
            .show()
            .text(titleText)
            .attr('title', titleText);
    }
};
