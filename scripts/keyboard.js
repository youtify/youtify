$(window).keydown(function(event) {
    if ($('input').is(":focus")) return; // Shouldn't the other keypresses make sure the event isn't propagated here?
    
    switch(event.keyCode) {
        case 32: // Space
            Player.playPause();
            event.preventDefault();
            break;
        case 27: // ESC
            Player.stopFullscreen();
            event.preventDefault();
            break;
        case 13: // Enter
            $('#results li.selected').dblclick();
            break;
        case 37: // Left
            if (event.ctrlKey || event.metaKey) {
                Player.prev();
            }
            if (event.shiftKey) {
                Player.seekBackward();
            }
            break;
        case 38: // Up
            if (event.ctrlKey || event.metaKey) {
                Player.volumeUp();
            }
            else {
                selectVideo($('#results-container li.selected').prev());
            }
			event.preventDefault();
            break;
        case 39: // Right
            if (event.ctrlKey || event.metaKey) {
                Player.next();
            }
            if (event.shiftKey) {
                Player.seekForward();
            }
            break;
        case 40: // Down
            if (event.ctrlKey || event.metaKey) {
                Player.volumeDown();
            }
            else {
                selectVideo($('#results-container li.selected').next());
            }
			event.preventDefault();
            break;
    }
});
