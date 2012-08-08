var WindowEvents = {
    windowResizedHandler: null,
    init: function() {
        $(window).resize(function() {
            if (WindowEvents.windowResizedHandler !== null) {
                window.clearTimeout(WindowEvents.windowResizedHandler);
            }
            WindowEvents.windowResizedHandler = window.setTimeout(WindowEvents.windowResized, 500);
        });
    },
    windowResized: function() {
        EventSystem.callEventListeners('window_resized', {width: $(window).width(), height: $(window).height()});
    }
};