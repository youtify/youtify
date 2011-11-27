/*global

$: true,
Player: true,
extractArtist: true,
showResultsItemContextMenu: true,

*/

function video_Init() {
    $('#info .share').click(function() {
        var videoId = Player.getCurrentVideoId();
        var title = $('#info .title').text();
        var elem = $('#info');
        showVideoSharePopup(videoId, title, elem, 'left');
    });
}

jQuery.fn.play = function() {
    var owner = $(this).parent().data('model');
    
    $('#left-menu li').removeClass('playing');
    if (owner) {
        Player.addSiblingsToPlayorder(this, owner.shuffle);
        if (owner.leftMenuDOMHandle) {
            owner.leftMenuDOMHandle.addClass('playing');
        }
    } else {
        Player.addSiblingsToPlayorder(this, false);
    }

	$('#results-container .playing').removeClass('playing');
	$(this[0]).addClass("playing");
	Player.play($(this[0]).data('videoId'), $(this[0]).find('.title').text());

	return this;
};

function selectVideo(li, event) {
	if (event !== undefined && (event.ctrlKey || event.metaKey)) {
		if (li.hasClass('selected')) {
			li.removeClass('selected');
		} else {
			li.addClass('selected');
        }
	} else if (event !== undefined && event.shiftKey &&  li.siblings('.selected').length > 0) {
		var elements = [li],
			found = false;

		// search down
		while (!found && $(elements[0]).next().length > 0) {
			elements.unshift(elements[0].next());
			if ($(elements[0]).hasClass('selected')) {
				found = true;
			}
		}
		if (!found) {
			elements = [li];
			// search up
			while (!found && $(elements[0]).prev().length > 0) {
				elements.unshift(elements[0].prev());
				if ($(elements[0]).hasClass('selected')) {
					found = true;
				}
			}
		}
		$(elements).each(function(index, item) {
            $(item).addClass('selected');
        });
	} else {
		li.siblings().removeClass('selected');
		li.addClass('selected');
	}
}

function createRatingBar(rating) {
    var ratingOuter = $('<div class="rating" title="Rating"/>');
    var ratingInner = $('<div/>');
    var percent = (rating / 5) * 100;
    ratingInner.css('width', percent + '%');
    ratingInner.appendTo(ratingOuter);
    return ratingOuter;
}
 
function createResultsItem(title, videoId, rating, isPlaylistItem) {
    var artist = extractArtist(title);
    var additionalMenuButtons = [];
	
    var li = $('<li/>')
        .addClass("draggable")
        .addClass("video")
        .data('type', 'video') // used for drag n drop
        .data('videoId', videoId)
        .attr('rel', videoId)
        .bind('contextmenu', showResultsItemContextMenu)
        .click(function(event) {
            selectVideo($(this), event);
            event.stopPropagation();
        });

    var hasTouch = /android|iphone|ipad/i.test(navigator.userAgent.toLowerCase());

    if (hasTouch) {
        li.doubletap(function(event) {
            $(this).play();
        });
    } else {
        li.dblclick(function(event) {
            $(this).play();
        });
    }

	$('<span/>')
		.addClass("icon")
        .click(function() {
            $(this).parent().play();
        })
		.appendTo(li);
	
	$('<span/>')
		.addClass("title")
		.text(title)
		.click(function(event) {
            selectVideo($(this).parent(), event);
            event.stopPropagation();
        })
		.appendTo(li);

    $('<span></span')
        .addClass('contextmenu')
        .addClass('clickable')
        .text('▽')
        .click(function(event) {
            var li = $(this).parent();
            li.trigger('contextmenu');
        })
        .appendTo(li);

    if (artist) {
        additionalMenuButtons.push({
            title: 'More from ' + artist,
            args: li,
            callback: function(li) {
                var artist = extractArtist(li.text());
                $('#search input').val(artist).keyup();
            }
        });
    }

    li.data('additionalMenuButtons', additionalMenuButtons);
    
    if (isPlaylistItem) {
        li.data('additionalMenuButtons').push({
            title: 'Delete',
            args: li,
            callback: deleteVideoButtonClicked
        });
        li.addClass('droppable');
        li.addClass('draggable');
        li.addClass('reorderable');
    }
    return li;
}

function showVideoSharePopup(videoId, title, elem, arrowDirection) {
    var video = new Video(videoId, title);

    $('#share-video-popup .link input').val(video.getUrl());

    $('#share-video-popup .twitter')
        .unbind('click')
        .click(function(event) {
            event.preventDefault();
            window.open(video.getTwitterShareUrl(), 'Share video on Twitter', 400, 400);
            return false;
        });

    $('#share-video-popup .facebook')
        .unbind('click')
        .click(function(event) {
            event.preventDefault();
            window.open(video.getFacebookShareUrl(), 'Share video on Facebook', 400, 400);
            return false;
        });

    elem.arrowPopup('#share-video-popup', arrowDirection);
}

function Video(videoId, title, type, rating) {
    this.videoId = videoId;
    this.title = title;
    this.type = type;
    this.rating = rating;

    this.getUrl = function() {
        return location.protocol + '//' + location.host + '/videos/' + this.videoId;
    };

    this.getTwitterShareUrl = function() {
        var url = this.getUrl(),
            text = "Check out this video!" + ' -- ' + this.title;
        return encodeURI('http://twitter.com/share?related=youtify&via=youtify' + '&url=' + url + '&counturl=' + url + '&text=' + text);
    };

    this.getFacebookShareUrl = function() {
        var url = this.getUrl();
        return 'http://facebook.com/sharer.php?u=' + url;
    };
    
    this.createListView = function() {
        var tr = $('<tr/>'),
            space = $('<td class="space"></td>');
        
        $('<td class="play">&#9654;</td>').appendTo(tr);
        space.clone().appendTo(tr);
        
        $('<td class="title"/>').text(this.title).appendTo(tr);
        space.clone().appendTo(tr);
        
        $('<td class="like">&hearts;</td>').appendTo(tr);
        space.clone().appendTo(tr);
        
        $('<td class="rating"/>').text(this.getRatingAsString()).appendTo(tr);
        
        return tr;
    };
    
    this.getRatingAsString = function() {
        return this.rating.toFixed(1);
    };
}
