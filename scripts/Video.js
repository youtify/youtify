function Video(args) {
    var self = this;

    this.videoId = args.videoId;
    this.flattrThingId = args.flattrThingId || null;
    this.flattrs = args.flattrs || null;
    this.title = $.trim(args.title) || '';
    this.artist = Utils.extractArtist(this.title);
    this.duration = args.duration || null;
    this.buyLinks = args.buyLinks || null;
    this.type = args.type || 'youtube';
    this.onPlayCallback = args.onPlayCallback;
    this.listView = null;
    this.uploaderUsername = args.uploaderUsername || null;
    this.artworkURL = args.artworkURL || null;
    
    this.clone = function() {
        return new Video({
            'videoId': this.videoId,
            'title': this.title,
            'type': this.type,
            'duration': this.duration,
            'onPlayCallback': this.onPlayCallback,
            'uploaderUsername': this.uploaderUsername,
            'artworkURL': this.artworkURL
        });
    };

    this.getUrl = function() {
        return location.protocol + '//' + location.host + '/tracks/' + this.type + '/' + this.videoId;
    };

    this.getExternalLink = function() {
        var ret = {
            label: '',
            url: ''
        };

        switch (this.type) {
            case 'youtube':
            ret.label = TranslationSystem.get('View on YouTube');
            ret.url = 'http://www.youtube.com/watch?v=' + this.videoId;
            break;

            case 'soundcloud':
            ret.label = TranslationSystem.get('View on SoundCloud');
            //ret.url = "http://api.soundcloud.com/tracks/" + this.videoId + ".json";
            ret.url = "/soundcloud_id_to_permalink?id=" + this.videoId;
            break;

            case 'officialfm':
            ret.label = TranslationSystem.get('View on Official.fm');
            ret.url = 'http://www.official.fm/tracks/' + this.videoId;
            break;
        }
        
        return ret;
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
    
    this.scrollTo = function() {
        var $container = this.listView.parents('#right > div'),
            viewTop = 0,
            containerTop = 0;
        if (this.listView && this.listView.is(':visible')) {
            containerTop = $container.scrollTop();
            viewTop = this.listView.position().top + containerTop - 84;
            if (viewTop < containerTop || viewTop + this.listView.height() > containerTop + $container.height()) {
                $container.animate({scrollTop: viewTop}, 400);
            }
        }
    };
    
    this.createAlternativeContextMenuButton = function(originalTrack, playlist) {
        var buttons = originalTrack.listView.data('additionalMenuButtons') || [];
        
        buttons.unshift({
            title: TranslationSystem.get('Replace with alternative'),
            cssClass: 'replace',
            args: null,
            callback: function() {
                var i = 0;
                for (i; i < playlist.videos.length; i += 1) {
                    if (playlist.videos[i] === originalTrack) {
                        playlist.videos.splice(i, 1, self);
                        playlist.synced = false;
                        playlist.sync();
                        self.createListView();
                        self.listView.insertAfter(originalTrack.listView);
                        originalTrack.listView.remove();
                    }
                }
            }
        });
    };
    
    this.createListView = function() {
        var buttons,
            externalLink = this.getExternalLink(),
            $fragment = document.createDocumentFragment(),
            $space = document.createElement('td'),
            $play = document.createElement('td'),
            $title = document.createElement('td'),
            $uploader = document.createElement('td'),
            $heart = document.createElement('td'),
            $menu = document.createElement('td'),
            $type = document.createElement('td');
        
        $space.setAttribute('class', 'space');

        $play.setAttribute('class', 'play');
        $play.onclick = function(event){self.play(event);};
        $fragment.appendChild($play);
        $fragment.appendChild($space.cloneNode(false));

        $title.innerHTML = this.title;
        $title.setAttribute('class', 'title');
        $fragment.appendChild($title);
        $fragment.appendChild($space.cloneNode(false));

        if (this.uploaderUsername) {
            $uploader.innerHTML = this.uploaderUsername;
            $uploader.setAttribute('class', 'uploader link');
            $fragment.appendChild($uploader);
            $fragment.appendChild($space.cloneNode(false));
        }
        
        $heart.setAttribute('class', 'like');
        $heart.innerHTML = '&hearts;';
        $fragment.appendChild($heart);
        $fragment.appendChild($space.cloneNode(false));
        
        $menu.setAttribute('class', 'menu');
        $menu.innerHTML = '';
        $fragment.appendChild($menu);
        $fragment.appendChild($space.cloneNode(false));

        $type.setAttribute('class', 'type');
        $type.innerHTML = '<a href="' + externalLink.url + '" title="' + externalLink.label + '" target="_blank">' + '&nbsp;' + '</a>';
        $fragment.appendChild($type);
        
        this.listView = document.createElement('tr');
        this.listView.setAttribute('class', 'draggable video ' + this.type);
        this.listView.appendChild($fragment);
        this.listView = $(this.listView)
            .bind('contextmenu', showResultsItemContextMenu)
            .mousedown(function(event) {self.listViewSelect(event);})
            .dblclick(function(event){self.play(event);})
            .data('model', this);
        this.listView.find('.menu').click(function(event) {
            showResultsItemContextMenu(event, $(event.target).parent());
        });

        if (this.uploaderUsername) {
            this.listView.find('.uploader').click(this.goToUploader);
        }
        
        buttons = this.listView.data('additionalMenuButtons') || [];
        
        if (self.buyLinks && self.buyLinks.length) {
            
            var i;
            for (i = 0; i < self.buyLinks.length; i += 1) {
                buttons.push({
                    title: TranslationSystem.get('Buy track'),
                    cssClass: 'buy',
                    args: self.buyLinks[i],
                    callback: Utils.openLink
                });
            }
        }
        this.listView.data('additionalMenuButtons', buttons);
        
        return this.listView;
    };

    this.goToUploader = function() {
        switch (self.type) {
            case 'soundcloud':
            ExternalUserPage.loadSoundCloudUser(self.uploaderUsername);
            break;

            case 'youtube':
            ExternalUserPage.loadYouTubeUser(self.uploaderUsername);
            break;

            default:
            throw 'Unknown type for external users: ' + self.type;
        }
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
        $('#left, #top .search').removeClass('focused');
        $('#right').addClass('focused');

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
            'type': this.type,
            'buyLinks': this.buyLinks
        };
    };
}
