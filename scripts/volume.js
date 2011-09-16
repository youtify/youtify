function volume_Init() {
    $('#outer-volume-slider').mousedown(function(event) {
        Volume.setVolume(event);
    });
    $('#volume-slider-knob').mousedown(function(event) {
        Volume.startDrag(event);
    });
    $(window).mouseup(function(event) {
        Volume.stopDrag(event);
    });
    $(window).mousemove(function(event) {
        Volume.onDrag(event);
    });
}

var Volume = {
    isDragging: false,
    startDrag: function(event) {
        Volume.isDragging = true;
    },
    stopDrag: function(event) {
        Volume.isDragging = false;
    },
    onDrag: function(event) {
        if (!Volume.isDragging) {
            return;
        }
        Volume.setVolume(event);
    },
    setVolume: function(event) {
        var paddingLeft = 7;
        var maxW = $('#outer-volume-slider').width();
        var mX = event.pageX - $('#outer-volume-slider').offset().left;
        if (mX < 0) {
            mX = 0;
        }
        if (mX > maxW) {
            mX = maxW;
        }

        Player.setVolume(mX/maxW*100.0);

        if (mX < paddingLeft) {
            mX = paddingLeft;
        }
        $('#volume-slider').css({'width': mX});
    }
};
