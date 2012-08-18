var FullScreen = {
    showBottomTimer: null,
    $bottom: null,
    $button: null,
    isOn: false,
    
    init: function() {
        var self = FullScreen;
        self.$bottom = $('#bottom');
        self.$button = $('#bottom .fullscreen');
        self.$button.click(self.toggle);
    },
    on: function() {
        var self = FullScreen;
        self.$button.addClass('on');
        $('body').addClass('fullscreen');
        $('body.fullscreen').mousemove(self.mouseMove);
        player.fullScreenOn();
        
        self.isOn = true;
    },
    off: function() {
        var self = FullScreen;
        self.$button.removeClass('on');
        $('body.fullscreen').unbind('mousemove');
        $('body').removeClass('fullscreen');
        player.fullScreenOff();

        self.isOn = false;
    },
    toggle: function() {
        var self = FullScreen;
        if (!self.isOn) {
            self.on();
        } else {
            self.off();
        }
    },
    mouseMove: function() {
        var self = FullScreen;
        if (self.showBottomTimer === null) {
            self.$bottom.addClass('on');
            self.showBottomTimer = setTimeout(function() {
                self.$bottom.removeClass('on');
                self.showBottomTimer = null;
            }, 1000);
        }
    }
};