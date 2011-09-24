/** DRAG N DROP FRAMEWORK
 ****************************************************************************/

var mousedown = false,
    mousedrag = false,
    sourceElem = null, // the REAL dragged element
    dragElem = null, // dragged element copy
    timeOfMouseDown = null,
    dropCallbacks = [],
    MOUSE_DRAG_TIMEOUT = 100, // Milliseconds until drag kicks in
    mouseDraggedCallback = null;

function registerDropCallback(f) {
    dropCallbacks.push(f);
}

function removeTargetClasses() {
    $('.target').removeClass('target');
    $('.insert-before').removeClass('insert-before');
    $('.insert-after').removeClass('insert-after');
    $('.alert').removeClass('alert');
}

function dragAborted() {
    if (dragElem) {
        dragElem.remove();
        dragElem = null;
    }
    removeTargetClasses();
}

/**
 * If the drag element has a child element with class 'title', this will
 * be used as text for the ghost element.
 */
function dragStarted(event) {
    sourceElem = findDraggable($(event.target)); // set global
	var text = '';
    if (sourceElem.find('.title').length) {
		var titles = sourceElem.find('.title').not(sourceElem.find('.alternative > .title'));
		$.each(titles, function(index, item) {
			text += $(item).text();
			if (index < titles.length-1) {
				text += '<br />';
            }
		});
	} else {
		text = sourceElem.text();
	}
	dragElem = $('<span id="dragElem" />')
        .html(text)
        .appendTo('body');
}

function dragEnded(event) {
    var droppable = findDroppable($(event.target)),
        i;

    if (droppable) {
        for (i = 0; i < dropCallbacks.length; i += 1) {
            dropCallbacks[i](dragElem, sourceElem, droppable);
        }
    }

    removeTargetClasses();

    if (dragElem) { // todo: fix, dragElem should always exist?
        dragElem.remove();
        dragElem = null;
    }
}

/**
 * Returns the droppable element, either the element itself
 * or any of its parents
 */
function findDroppable(elem) {
    var droppable;
    if (elem.hasClass('droppable')) {
        droppable = elem;
    } else {
        droppable = elem.parents('.droppable');
        if (droppable) {
            droppable = $(droppable[0]);
        }
    }
    return droppable;
}

function findDraggable(elem) {
    var draggable;
    if (elem.hasClass('draggable')) {
        draggable = elem;
    } else {
        draggable = elem.parents('.draggable');
        if (draggable) {
            draggable = $(draggable[0]);
        }
    }
	if (draggable.hasClass('selected')) {
		draggable = draggable.parent().children('.selected');
	} else {
		selectVideo(draggable);
	}
    return draggable;
}

function mouseDragged(event) {
    var target = $(event.target);
    var droppable = findDroppable(target);

    if (!dragElem) { // really needed?
        return;
    }

    dragElem.css({
        'top': event.pageY,
        'left': event.pageX + 10
    });
    
    removeTargetClasses();

    if (mouseDraggedCallback) {
        mouseDraggedCallback(droppable, sourceElem);
    }

    if (droppable) {
        if (sourceElem.data('type') !== undefined) {
            if (droppable.data('type') !== sourceElem.data('type')) {
                droppable.addClass('target');
            }
        } else {
            droppable.addClass('target');
        }
        
        if (droppable.hasClass('reorderable') && droppable.data('type') === sourceElem.data('type')) {
            droppable.addClass('insert-before');
        }
    }
}

$(window).mousemove(function (event) {
    if (!mousedrag && mousedown && ($(event.target).hasClass('draggable') || $(event.target).parents('.draggable').length > 0)) {
        var now = new Date().getTime();
        if ((now - timeOfMouseDown) >= MOUSE_DRAG_TIMEOUT) {
            mousedrag = true;
            dragStarted(event);
        }
    }
    
    if (mousedrag) {
        mouseDragged(event);
    }
});

$(window).mouseup(function (event) {
    $('body').removeClass('mousedrag');
    mousedown = false;

    if (mousedrag) {
        mousedrag = false;
        dragEnded(event);
    }
});


$('.draggable').live('mousedown', function (event) {
    timeOfMouseDown = new Date().getTime();
    if ($(event.target).hasClass('draggable') || 
		$(event.target).parents('.draggable') ) {
        mousedown = true;
    }
});

$(window).keyup(function (event) {
    if (event.keyCode === 27) { // ESC
        dragAborted();
    }
});


/** DRAG N DROP CALLBACKS
 ****************************************************************************/

mouseDraggedCallback = function(targetElem, sourceElem) {
    if (targetElem.attr('id') === 'results-container' && sourceElem.hasClass('video')) {
        $('#playlist .video:last').addClass('insert-after');
    }
};

// VIDEO DROPPED ON #results-container
registerDropCallback(function (dragElem, sourceElem, targetElem) {
    var playlistElem,
        destIndex,
        sourceIndex,
        playlist;

    if ($('#playlists .selected').length) {
        playlistElem = $('.playlistElem.selected');
        if (targetElem.attr('id') === 'results-container' && sourceElem.hasClass('video') && playlistElem.length) {
            sourceIndex = sourceElem.index();
            destIndex = $('#playlist .video:last').index() + 1;

            playlist = playlistElem.data('model');
            playlist.moveVideo(sourceIndex, destIndex);
            playlistManager.save();

            playlistElem.click(); // trigger a rerender
        }
    }
});

// VIDEO DROPPED ON PLAYLIST
registerDropCallback(function (dragElem, sourceElem, targetElem) {
    if (targetElem.hasClass('playlistElem') && sourceElem.hasClass('video')) {
        var playlist = targetElem.data('model');
        $.each(sourceElem, function(index, item) {
            item = $(item);
            if (item.hasClass('video')) {
                playlist.addVideo(item.find('.title').text(), item.data('videoId'));
                item.removeClass('selected');
            }
        });
        playlistManager.save();
        constructPlaylistsMenu();
    }
});

// VIDEO DROPPED ON #new-playlist
registerDropCallback(function (dragElem, sourceElem, targetElem) {
    if (targetElem.attr('id') === 'new-playlist' && sourceElem.hasClass('video')) {
        pendingVideo = {
            title: sourceElem.find('.title').text(),
            videoId: sourceElem.data('videoId')
        };
        $('#new-playlist span').click();
    }
});

// VIDEO TITLE DROPPED ON #new-playlist
registerDropCallback(function (dragElem, sourceElem, targetElem) {
    if (targetElem.attr('id') === 'new-playlist' && sourceElem.attr('id') === 'info') {
        pendingVideo = {
            title: sourceElem.find('.title').text(),
            videoId: Player.getCurrentVideoId()
        };
        $('#new-playlist span').click();
    }
});

// VIDEO TITLE DROPPED ON PLAYLIST
registerDropCallback(function (dragElem, sourceElem, targetElem) {
    if (targetElem.hasClass('playlistElem') && sourceElem.attr('id') === 'info') {
        var playlist = targetElem.data('model');
        playlist.addVideo(sourceElem.find('.title').text(), Player.getCurrentVideoId());
        playlistManager.save();
        constructPlaylistsMenu();
    }
});

// VIDEO DROPPED ON ANOTHER VIDEO
registerDropCallback(function (dragElem, sourceElem, targetElem) {
    var playlist = $('#playlistbar').data('playlist');
    if (targetElem.hasClass('video') && sourceElem.hasClass('video')) {
        playlist.moveVideo(sourceElem.index(), targetElem.index());
        playlistManager.save();
        sourceElem.detach().insertBefore(targetElem);
    }
});
