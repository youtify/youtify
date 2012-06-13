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
        var self = this,
            $fragment = document.createDocumentFragment(),
            $space = document.createElement('td'),
            $play = document.createElement('td'),
            $title = document.createElement('td'),
            $heart = document.createElement('td'),
            $flattr = null,
            $type = document.createElement('td');
            
        
        $space.setAttribute('class', 'space');

        $play.innerHTML = '&#9654;';
        $play.setAttribute('class', 'play');
        $play.onclick = function(event){self.play(event);};
        $fragment.appendChild($play);
        $fragment.appendChild($space.cloneNode(false));

        $title.innerHTML = this.title;
        $title.setAttribute('class', 'title');
        $fragment.appendChild($title);
        $fragment.appendChild($space.cloneNode(false));

        if (this.flattrThingId) {
            $flattr = document.createElement('td');
            $flattr.setAttribute('class', 'flattr');
            $fragment.appendChild( $($flattr).append(this.createFlattrButton())[0]);
        }
        
        $heart.setAttribute('class', 'like');
        $heart.innerHTML = '&hearts;';
        $fragment.appendChild($heart);
        $fragment.appendChild($space.cloneNode(false));

        $type.setAttribute('class', 'type');
        $type.innerHTML = '&nbsp;';
        $fragment.appendChild($type);
        
        
        this.listView = document.createElement('tr');
        this.listView.setAttribute('class', 'draggable video ' + this.type);
        this.listView.appendChild($fragment);
        this.listView = $(this.listView)
            .bind('contextmenu', showResultsItemContextMenu)
            .mousedown(function(event) {self.listViewSelect(event);})
            .dblclick(function(event){self.play(event);})
            .data('model', this);
        
        if (this.flattrThingId) {
            this.listView.addClass('has-flattr');
        }
        return this.listView;
    };
    
    /**
     * Sets the selected style etc for this list view (and others if the shift
     * key is held down).
     *
     * Alternatively, another listView element can be passed which will then
     * be used instead of this videos list view. This is used from the play
     * queue where the listView element being pressed is a "ghost" element.
     */
    this.listViewSelect = function(event, $listView) {
        if ($listView === undefined) {
            $listView = this.listView;
        }
        if ($listView.hasClass('selected')) {
            return;
        }
        if (event !== undefined && (event.ctrlKey || event.metaKey)) {
            if ($listView.hasClass('selected')) {
                $listView.removeClass('selected');
            } else {
                $listView.addClass('selected');
                selectedVideoElements.push($listView);
            }
        } else if (event !== undefined && event.shiftKey &&  $listView.siblings('.selected').length > 0) {
            var elements = [$listView],
                found = false;

            // search down
            while (!found && $(elements[0]).next().length > 0) {
                elements.unshift(elements[0].next());
                if ($(elements[0]).hasClass('selected')) {
                    found = true;
                }
            }
            if (!found) {
                elements = [$listView];
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

            selectedVideoElements = selectedVideoElements.concat(elements);
        } else {
            Utils.deSelectSelectedVideos();
            selectedVideoElements.push($listView);
            $listView.addClass('selected');
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
                    } else {
                        EventSystem.callEventListeners('flattr_click_made', data);
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
