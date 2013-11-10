var BottomPanel = {
    init: function() {
        // TITLE
        EventSystem.addEventListener('video_info_fetched', function(info) {
            BottomPanel.setTitleText(info.title);
        });

        $('#bottom .info .i').click(function() {
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
        $('#bottom .info .title').click(function() {
            Utils.showWhatIsCurrentlyPlaying();
        });

        // CONTROLS
        $('#bottom .controls .playpause').click(player.playPause);
        $('#bottom .controls .next').click(player.next);
        $('#bottom .controls .prev').click(player.prev);
        
        // FULLSCREEN is set in FullScreen.js
        
        // SHUFFLE
        if (new Settings().shuffle) {
            $('#bottom .shuffle').addClass('on');
        }
        
        $('#bottom .shuffle').click(function() {
            var settings = new Settings(),
                $this = $(this);
            $this.toggleClass('on');
            settings.shuffle = $this.hasClass('on');
            settings.saveLocal();

            if (player.currentVideo && player.currentVideo.listView) {
                Queue.addSiblingsToPlayorder(player.currentVideo.listView);
            }
        });
    },
    setTitleText: function(titleText) {
        $('#bottom .info .i').css({'display': 'inline-block'});
        $('#bottom .info .title')
            .text(titleText)
            .attr('title', titleText);
    },
    show: function() {
        $('#bottom').show();
    },
    hide: function() {
        $('#bottom').hide();
    }
};
