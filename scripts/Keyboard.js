$(window).keydown(function(event) {
    var model = null;
    
    if ($('input, textarea').is(":focus")) {
        return; // Shouldn't the other keypresses make sure the event isn't propagated here?
    }
    
	//console.log(event.keyCode);
    switch(event.keyCode) {
        case 32: // Space
            player.playPause();
            event.preventDefault();
            break;
        case 27: // ESC
            $('.modalbox, #arrow-popup-blocker').click();
            $('#context-menu-blocker').mousedown();
            player.fullScreenOff();
            event.preventDefault();
            break;
        case 13: // Enter
            $('#results li.selected').dblclick();
            break;
        case 37: // Left
            if (event.ctrlKey || event.metaKey) {
                player.prev();
            }
            if (event.shiftKey) {
                player.seek(-5);
            }
            break;
        case 38: // Up
            if (event.ctrlKey || event.metaKey) {
                player.setRelativeVolume(10);
            }
            else {
                model = $('#right .pane.selected .video.selected:first').prev().data('model');
                if (model) {
                    if (event.shiftKey) {
                        model.listViewSelect(event);
                    } else {
                        model.listViewSelect();
                    }
                }
            }
			event.preventDefault();
            break;
        case 39: // Right
            if (event.ctrlKey || event.metaKey) {
                player.next();
            }
            if (event.shiftKey) {
                player.seek(5);
            }
            break;
        case 40: // Down
            if (event.ctrlKey || event.metaKey) {
                player.setRelativeVolume(-10);
            }
            else {
                model = $('#right .pane.selected .video.selected:last').next().data('model');
                if (model) {
                    if (event.shiftKey) {
                        model.listViewSelect(event);
                    } else {
                        model.listViewSelect();
                    }
                }
            }
			event.preventDefault();
            break;
		case 65: // A
            if (event.ctrlKey || event.metaKey) {
                $('#results-container li.selected').siblings().addClass('selected');
            }
			event.preventDefault();
			return false;
    }
});
