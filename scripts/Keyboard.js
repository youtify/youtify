
var Keyboard = {
    init: function() {
        $(window).keydown(Keyboard.keyDown);
    },
    keyDown: function(event) {
        var self = Keyboard;
        if ($('input, textarea').not('.filter input').is(":focus") && event.keyCode !== 9) {
            return; // Shouldn't the other keypresses make sure the event isn't propagated here?
        }
        
        //console.log(event.keyCode);
        switch(event.keyCode) {
            case 9: // TAB
                self.tab(event);
                break;
            case 32: // Space
                self.space(event);
                break;
            case 27: // ESC
                self.esc(event);
                break;
            case 13: // Enter
                $('#right > div:visible .tracklist .video.selected:first').dblclick();
                break;
            case 37: // Left
                self.left(event);
                break;
            case 38: // Up
                self.up(event);
                break;
            case 39: // Right
                self.right(event);
                break;
            case 40: // Down
                self.down(event);
                break;
            case 65: // A
                return self.a(event);
            case 70: // F
                return self.f(event);
        }
    },
    tab: function(event) {
        var list = [ $('#left'), $('#top .search input[type="search"]'), $('#right') ],
            i = 0,
            len = list.length,
            noFocus = true;
        
        if (event.shiftKey) {
            for (i = len -1; i >= 0; i -= 1) {
                if (list[i].hasClass('focused')) {
                    list[i].removeClass('focused');
                    list[i].blur(); // Make sure inputs lose focus.
                    noFocus = false;
                    if (i - 1 >= 0) {
                        list[i - 1].addClass('focused');
                        list[i - 1].focus();
                    } else {
                        list[len -1].addClass('focused');
                        list[len -1].focus();
                    }
                    break;
                }
            }        
        } else {
            for (i; i < len; i += 1) {
                if (list[i].hasClass('focused')) {
                    list[i].removeClass('focused');
                    list[i].blur(); // Make sure inputs lose focus.
                    noFocus = false;
                    if (i + 1 < len) {
                        list[i + 1].addClass('focused');
                        list[i + 1].focus();
                    } else {
                        list[0].addClass('focused');
                        list[0].focus();
                    }
                    break;
                }
            }
        }
        
        // None of the elems had focus. Set focus to the first.
        if (noFocus) {
            list[0].addClass('focused');
        }
        event.preventDefault();
    },
    space: function(event) {
        player.playPause();
        event.preventDefault();
    },
    esc: function(event) {
        Utils.closeAnyOpenArrowPopup();
        $('.modalbox').click();
        $('#context-menu-blocker').mousedown();
        FullScreen.off();
        event.preventDefault();
    },
    left: function(event) {
        if (event.ctrlKey || event.metaKey) {
            player.prev();
        }
        if (event.shiftKey) {
            player.seek(-5);
        }
    },
    up: function(event) {
        var model, parent, next, selected, nextRight;
        if (event.ctrlKey || event.metaKey) {
            player.setRelativeVolume(10);
        } else {
            if ($('#right').hasClass('focused')) {
                nextRight = $('#right > div:visible .tracklist:visible .video.selected:first').prev();
                while (nextRight.length > 0 && nextRight.is(':visible') === false) {
                    nextRight = nextRight.prev();
                }
                model = nextRight.data('model');
                if (!model) {
                    model = $('#right > div:visible .tracklist:visible .video:visible:last').data('model');
                }
                if (model) {
                    if (event.shiftKey) {
                        model.listViewSelect(event);
                    } else {
                        model.listViewSelect();
                        model.scrollTo();
                    }
                }
            }
            if ($('#left').hasClass('focused')) {
                selected = $('#left .menu li.selected');
                if (selected.length === 0) {
                    selected = $('#left .menu li:visible:last');
                    selected.trigger('mousedown');
                    return;
                }
                next = selected.prev('li:visible');
                parent = selected.parents('.group');
                while (next.length === 0 && parent.length > 0) {
                    parent = parent.prev();
                    next = parent.find('li:visible:last');
                }
                if (next.length > 0) {
                    next.trigger('mousedown');
                }
            }
        }
        event.preventDefault();
    },
    right: function(event) {
        if (event.ctrlKey || event.metaKey) {
            player.next();
        }
        if (event.shiftKey) {
            player.seek(5);
        }
    },
    down: function(event) {
        var model, parent, next, selected, nextRight;
        if (event.ctrlKey || event.metaKey) {
            player.setRelativeVolume(-10);
        } else {
            if ($('#right').hasClass('focused')) {
                nextRight = $('#right > div:visible .tracklist:visible .video.selected:last').next();
                while (nextRight.length > 0 && nextRight.is(':visible') === false) {
                    nextRight = nextRight.next();
                }
                model = nextRight.data('model');
                if (!model) {
                    model = $('#right > div:visible .tracklist:visible .video:visible:first').data('model');
                }
                if (model) {
                    if (event.shiftKey) {
                        model.listViewSelect(event);
                    } else {
                        model.listViewSelect();
                        model.scrollTo();
                    }
                }
            }
            if ($('#left').hasClass('focused')) {
                selected = $('#left .menu li.selected');
                if (selected.length === 0) {
                    selected = $('#left .home'); // Hardcoded Home since first li is a group
                    selected.trigger('mousedown');
                    return;
                }
                next = selected.next('li:visible');
                parent = selected.parents('.group');
                while (next.length === 0 && parent.length > 0) {
                    parent = parent.next();
                    next = parent.find('li:visible:first');
                }
                if (next.length > 0) {
                    next.trigger('mousedown');
                }
            }
        }
        event.preventDefault();
    },
    a: function(event) {
        if (event.ctrlKey || event.metaKey) {
            $('#right > div:visible .tracklist:visible .video').siblings().addClass('selected');
            event.preventDefault();
            return false;
        }
        return true;
    },
    f: function(event) {
        var tracklist;
        if (event.ctrlKey || event.metaKey) {
            if ($('#right').hasClass('focused')) {
                tracklist = $('#right > div:visible .tracklist:visible');
                if (tracklist.length > 0) {
                    Filter.showRight();
                }
            } else if ($('#left').hasClass('focused')) {
                Filter.showLeft();
            } else {
                return true;
            }
            event.preventDefault();
            return false;
        }
        return true;
    }
};
