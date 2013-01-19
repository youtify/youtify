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
            Utils.closeAnyOpenArrowPopup();
            $('.modalbox').click();
            $('#context-menu-blocker').mousedown();
            FullScreen.off();
            event.preventDefault();
            break;
        case 13: // Enter
            $('#right > div:visible .tracklist .video.selected:first').dblclick();
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
                model = $('#right > div:visible .tracklist .video.selected:first').prev().data('model');
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
                model = $('#right > div:visible .tracklist .video.selected:last').next().data('model');
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
                $('#right > div:visible .tracklist .video').siblings().addClass('selected');
            }
			event.preventDefault();
			return false;
    }
});
