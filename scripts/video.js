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
    this.title = $.trim(title) || '';
    this.artist = extractArtist(this.title);
    this.type = type;
    this.rating = rating;
    this.listView = null;
    
    this.clone = function() {
        return new Video(this.videoId, this.title, this.type, this.rating);
    };

    this.getUrl = function() {
        return location.protocol + '//' + location.host + '/videos/' + this.videoId;
    };

    this.getYouTubeUrl = function() {
        return 'http://www.youtube.com/watch?v=' + this.videoId;
    },

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
        var space = $('<td class="space"></td>'),
            self = this,
            select = (function(event) {
                    self.listViewSelect(event);
                    event.stopPropagation();
                }),
            play = (function(event) {
                    self.play(event);
                });
        
        this.listView = $('<tr/>')
            .addClass("draggable")
            .addClass("video")
            .bind('contextmenu', showResultsItemContextMenu)
            .click(select)
            .data('model', self);
        
        
        $('<td class="play">&#9654;</td>')
            .click(play)
            .appendTo(this.listView);
        space.clone().appendTo(this.listView);
        
        var titleElem = $('<td class="title"/>')
            .click(select)
            .text(this.title)
            .appendTo(this.listView);
        space.clone().appendTo(this.listView);
        
        $('<td class="like">&hearts;</td>')
            .appendTo(this.listView);
        space.clone().appendTo(this.listView);
        
        $('<td class="rating"/>')
            .text(this.getRatingAsString())
            .appendTo(this.listView);

        this.listView.dblclick(play);
        titleElem.dblclick(play);
        
        return this.listView;
    };
    
    this.getRatingAsString = function() {
        return (this.rating === undefined ? 0 : this.rating.toFixed(1));
    };
    
    this.listViewSelect = function(event) {
        if (event !== undefined && (event.ctrlKey || event.metaKey)) {
            if (this.listView.hasClass('selected')) {
                this.listView.removeClass('selected');
            } else {
                this.listView.addClass('selected');
            }
        } else if (event !== undefined && event.shiftKey &&  this.listView.siblings('.selected').length > 0) {
            var elements = [this.listView],
                found = false;

            // search down
            while (!found && $(elements[0]).next().length > 0) {
                elements.unshift(elements[0].next());
                if ($(elements[0]).hasClass('selected')) {
                    found = true;
                }
            }
            if (!found) {
                elements = [this.listView];
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
            this.listView.siblings().removeClass('selected');
            this.listView.addClass('selected');
        }
    };
    
    this.play = function(event) {
        event.stopPropagation();

        $('#left li').removeClass('playing');
        $('#right .video').removeClass('playing');
        this.listView.addClass("playing");
        
        /* if user clicked on view */
        if (event) {
            Player.addSiblingsToPlayorder(this.listView, false);
        }
        
        Player.play(this);
    };

    this.toJSON = function() {
        return {
            'videoId': this.videoId,
            'title': this.title
        };
    };
}





/* 
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
*/
