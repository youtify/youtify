var Timeline = {
    hasThrownAlmostDoneEvent: false,
    isDragging: false,
    updateHandle: null,
    bufferHandle: null,
    $pos: null,
    $len: null,
    $slider: null,
    $buffer: null,
    $timeline: null,
    
    init: function() {
        Timeline.$pos = $('#bottom .timeline-wrapper .position');
        Timeline.$len = $('#bottom .timeline-wrapper .length');
        Timeline.$slider = $('#bottom .timeline-wrapper .slider');
        Timeline.$buffer = $('#bottom .timeline-wrapper .buffer');
        Timeline.$timeline = $('#bottom .timeline');
        
        $('#bottom .timeline').mousedown(function(event) {
            Timeline.manualUpdate(event);
        });
        $('#bottom .timeline .slider .knob').mousedown(function(event) {
            Timeline.startDrag(event);
        });
        $(window).mouseup(function(event) {
            Timeline.stopDrag(event);
        });
        $(window).mousemove(function(event) {
            Timeline.onDrag(event);
        });
    },

    startDrag: function(event) {
        Timeline.isDragging = true;
    },
    stopDrag: function(event) {
        if (Timeline.isDragging) {
            Timeline.stop();
            Timeline.isDragging = false;
            Timeline.manualUpdate(event);
            Timeline.start();
        }
    },
    onDrag: function(event) {
        if (!Timeline.isDragging) {
            return;
        }
        Timeline.manualUpdate(event);
    },
    
	start: function() {
        Timeline.hasThrownAlmostDoneEvent = false;
		$('#bottom .timeline .knob').show();
        if (Timeline.updateHandle === null) {
            Timeline.updateHandle = setInterval(Timeline.update, 100);
        }
        if (Timeline.bufferHandle === null) {
            Timeline.bufferHandle = setInterval(Timeline.updateBuffer, 1000);
        }
	},
    stop: function() {
		if (Timeline.updateHandle) {
			clearInterval(Timeline.updateHandle);
			Timeline.updateHandle = null;
		}
	},
    
    manualUpdate: function(event) {
        var maxWidth = Timeline.$timeline.width(),
            mouseX = event.pageX - Timeline.$slider.offset().left,
            pos = null,
            len = player.getTotalPlaybackTime();
        
        if (mouseX < 0) {
            mouseX = 0;
        }
        if (mouseX > maxWidth) {
            mouseX = maxWidth;
        }
        pos = mouseX / maxWidth * len;

        Timeline.$pos.html(Math.floor(pos/60.0)+':' + ((Math.floor(pos%60) <10) ? '0' : '') + Math.floor(pos%60));
        Timeline.$len.html(Math.floor(len/60.0)+':' + ((Math.floor(len%60) <10) ? '0' : '') + Math.floor(len%60));
		Timeline.$slider.width(pos/len*maxWidth);
        
        if (!Timeline.isDragging) {
            player.seekTo(pos);
        }
        Timeline.$buffer.width(player.getBuffer() / 100.0 * maxWidth);
    },
	update: function(percent) { 
		if (Timeline.isDragging) {
            return;
        }
        var pos = player.getCurrentPlaybackTime(),
            len = player.getTotalPlaybackTime(),
            width = Timeline.$timeline.width();

        if (!Timeline.hasThrownAlmostDoneEvent && pos/len > 0.9) {
            Timeline.hasThrownAlmostDoneEvent = true;
            EventSystem.callEventListeners('song_almost_done_playing', player.currentVideo);
        }
        
        if (pos && len) {
            Timeline.$pos.html(Math.floor(pos/60.0)+':' + ((Math.floor(pos%60) <10) ? '0' : '') + Math.floor(pos%60));
            Timeline.$len.html(Math.floor(len/60.0)+':' + ((Math.floor(len%60) <10) ? '0' : '') + Math.floor(len%60));
            Timeline.$slider.width(pos/len*width);
        } else {
            Timeline.$pos.html('0:00');
            Timeline.$len.html('0:00');
            Timeline.$slider.width(0);
        }
	},
    
    updateBuffer: function(buffer) {
        if (buffer === null || buffer === undefined) {
            buffer = player.getBuffer();
        }
        Timeline.$buffer.width(buffer / 100.0 * Timeline.$timeline.width());
    }
	
};
