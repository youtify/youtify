function showVideoSharePopup(video, elem, arrowDirection) {
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

function Video(args) {
    this.videoId = args.videoId;
    this.flattrThingId = args.flattrThingId || null;
    this.flattrs = args.flattrs || null;
    this.title = $.trim(args.title) || '';
    this.artist = Utils.extractArtist(this.title);
    this.duration = args.duration || null;
    this.type = args.type || 'youtube';
    this.onPlayCallback = args.onPlayCallback;
    this.listView = null;
    
    this.clone = function() {
        return new Video({
            'videoId': this.videoId,
            'title': this.title,
            'type': this.type,
            'duration': this.duration,
            'onPlayCallback': this.onPlayCallback
        });
    };

    this.getUrl = function() {
        return location.protocol + '//' + location.host + '/tracks/' + this.type + '/' + this.videoId;
    };

    this.getYouTubeUrl = function() {
        return 'http://www.youtube.com/watch?v=' + this.videoId;
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
        var space = $('<td class="space"></td>'),
            self = this,
            select = function(event) {
                    self.listViewSelect(event);
                    event.stopPropagation();
                },
            play = function(event) {
                    self.play(event);
                };
        
        this.listView = $('<tr/>')
            .addClass("draggable")
            .addClass("video")
            .addClass(self.type)
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

        if (this.flattrThingId) {
            this.listView.addClass('has-flattr');
            $('<td class="flattr"></td>')
                .append(this.createFlattrButton())
                .appendTo(this.listView);
        }
        
        $('<td class="like">&hearts;</td>')
            .appendTo(this.listView);
        space.clone().appendTo(this.listView);

        $('<td class="type">&nbsp;</td>')
            .appendTo(this.listView);

        this.listView.dblclick(play);
        titleElem.dblclick(play);
        
        return this.listView;
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

    this.createFlattrButton = function() {
        var self = this;
        return $('<span class="button"><span class="count">' + (this.flattrs || 0) + '</span><span class="text">Flattr</span></span>')
            .click(function() {
                if (!has_flattr_access_token) {
                    new WhatIsFlattrDialog().show();
                    return;
                }

                var $button = $(this);
                var url;
                var postParams;

                function increaseCount() {
                    var $count = $button.find('.count');
                    $count.text(String(Number($count.text()) + 1));
                }
                function decreaseCount() {
                    var $count = $button.find('.count');
                    $count.text(String(Number($count.text()) - 1));
                }

                if ($button.hasClass('loading')) {
                    return;
                }

                $button.addClass('loading');

                // Always update the count
                increaseCount();

                url = '/flattrclick';
                postParams = {
                    thing_id: self.flattrThingId
                };
                $.post(url, postParams, function(data) {
                    $button.removeClass('loading');
                    if (data === null) {
                        alert("Error: response from Flattr was null");
                        decreaseCount();
                    } else if (data.hasOwnProperty('error_description')) {
                        alert(data.error_description);
                        decreaseCount();
                    }
                });
            });
    };
    
    this.play = function(event) {
        $('#right .video').removeClass('playing');
        this.listView.addClass("playing");
        
        /* if user clicked on view */
        if (event) {
            event.stopPropagation();
            Queue.addSiblingsToPlayorder(this.listView);
        }
        
        if (this.onPlayCallback) {
            this.onPlayCallback();
        }
        
        player.play(this);
    };

    this.toJSON = function() {
        return {
            'videoId': this.videoId,
            'title': this.title,
            'duration': this.duration,
            'type': this.type
        };
    };
}
