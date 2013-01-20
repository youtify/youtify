$(window).keydown(function(event) {
    var model = null;
    
    if ($('input, textarea').is(":focus") && event.keyCode !== 9) {
        return; // Shouldn't the other keypresses make sure the event isn't propagated here?
    }
    
	//console.log(event.keyCode);
    switch(event.keyCode) {
        case 9: // TAB
            var i = 0,
                noFocus = true;
                list = [ $('#left'), $('#top .search input[type="search"]'), $('#right') ];
            
            for (i; i < list.length; i += 1) {
                if (list[i].hasClass('focused')) {
                    list[i].removeClass('focused');
                    list[i].blur(); // Make sure inputs lose focus.
                    noFocus = false;
                    if (i + 1 < list.length) {
                        list[i + 1].addClass('focused');
                        list[i + 1].focus();
                    } else {
                        list[0].addClass('focused');
                        list[0].focus();
                    }
                    break;
                }
            }
            
            // None of the elems had focus. Set focus to the first.
            if (noFocus) {
                list[0].addClass('focused');
            }
            event.preventDefault();
            break;
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
            } else {
                if ($('#right').hasClass('focused')) {
                    model = $('#right > div:visible .tracklist:visible .video.selected:first').prev().data('model');
                    if (!model) {
                        model = $('#right > div:visible .tracklist:visible .video:last').data('model');
                    }
                    if (model) {
                        if (event.shiftKey) {
                            model.listViewSelect(event);
                        } else {
                            model.listViewSelect();
                        }
                    }
                }
                if ($('#left').hasClass('focused')) {
                    var parent, next, selected = $('#left .menu li.selected');
                    next = selected.prev('li');
                    parent = selected.parents('.group');
                    while (next.length === 0 && parent.length > 0) {
                        parent = parent.prev();
                        next = parent.find('li:last');
                    }
                    if (next.length > 0) {
                        next.trigger('mousedown');
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
            } else {
                if ($('#right').hasClass('focused')) {
                    model = $('#right > div:visible .tracklist:visible .video.selected:last').next().data('model');
                    if (!model) {
                        model = $('#right > div:visible .tracklist:visible .video:first').data('model');
                    }
                    if (model) {
                        if (event.shiftKey) {
                            model.listViewSelect(event);
                        } else {
                            model.listViewSelect();
                        }
                    }
                }
                if ($('#left').hasClass('focused')) {
                    var parent, next, selected = $('#left .menu li.selected');
                    next = selected.next('li');
                    parent = selected.parents('.group');
                    while (next.length === 0 && parent.length > 0) {
                        parent = parent.next();
                        next = parent.find('li:first');
                    }
                    if (next.length > 0) {
                        next.trigger('mousedown');
                    }
                }
            }
			event.preventDefault();
            break;
		case 65: // A
            if (event.ctrlKey || event.metaKey) {
                $('#right > div:visible .tracklist:visible .video').siblings().addClass('selected');
            }
			event.preventDefault();
			return false;
        case 70: // F
            break;
    }
});
