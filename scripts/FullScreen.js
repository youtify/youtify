var FullScreen = {
    showBottomTimer: null,
    $bottom: null,
    $button: null,
    documentElem: null,
    isOn: false,
    
    init: function() {
        var self = FullScreen;
        self.documentElem = document.documentElement;
        
        document.addEventListener("fullscreenchange", function () {
            if (!document.fullscreen) {
                self.off();
            }
        }, false);

        document.addEventListener("mozfullscreenchange", function () {
            if (!document.mozFullScreen) {
                self.off();
            }
        }, false);

        document.addEventListener("webkitfullscreenchange", function () {
            if (!document.webkitIsFullScreen) {
                self.off();
            }
        }, false);
        
        self.$bottom = $('#bottom');
        self.$button = $('#bottom .fullscreen');
        self.$button.click(self.toggle);

        // Make double clicking on player enter fullscreen.
        // In fullscreen, .players doesn't receive click events
        // when YouTube is playing, but #right does.
        $('.players').dblclick(function(event) {
            if (player.getCurrentVideo() && player.getCurrentVideo().type === 'youtube') {
                if (!self.isOn) {
                    self.on();
                }
            } else {
                self.toggle();
            }
        });
        $('#right').dblclick(function(event) {
            if (player.getCurrentVideo() && player.getCurrentVideo().type === 'youtube' && self.isOn) {
                self.off();
            }
        });
    },
    on: function() {
        var self = FullScreen;
        self.$button.addClass('on');
        $('body').addClass('fullscreen');
        $('body.fullscreen').mousemove(self.mouseMove);
        
        // Try native fullscreen
        if (self.documentElem.requestFullscreen) {
            self.documentElem.requestFullscreen();
        }
        else if (self.documentElem.mozRequestFullScreen) {
            self.documentElem.mozRequestFullScreen();
        }
        else if (self.documentElem.webkitRequestFullScreen) {
            self.documentElem.webkitRequestFullScreen();
        }
        
        player.fullScreenOn();
        self.isOn = true;
    },
    off: function() {
        var self = FullScreen;
        self.$button.removeClass('on');
        $('body.fullscreen').unbind('mousemove');
        $('body').removeClass('fullscreen');
        
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
        
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
