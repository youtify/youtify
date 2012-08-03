var HomeScreen = {
    $rightView: null,
    menuItem: null,
    
    artists: [
      { displayName: 'Monstercat', name: 'monstercatmedia', id: '8553751', img: '/images/profiles/monstercat.png', type: 'soundcloud', backgroundColor: '#FFF' },
      { displayName: 'UKF Dubstep', name: 'ukfdubstep', id: 'ukfdubstep', img: '/images/profiles/ukf.png', type: 'youtube', backgroundColor: '#000' },
      { displayName: 'Robyn', name: 'robyn', id: '421860', img: '/images/profiles/robyn.png', type: 'soundcloud', backgroundColor: '#cbcbcb' }
    ],

    init: function() {
        this.$rightView = $('#right > .home');
        this.menuItem = new MenuItem({
            cssClasses: ['home'],
            title: TranslationSystem.get('Home'),
            $contentPane: this.$rightView,
            onSelected: function() {
                HomeScreen.show();
            },
            translatable: true
        });
        Menu.getGroup('misc').addMenuItem(this.menuItem);
    },

    show: function() {
        self = this;
        // Only load when needed
        if (self.$rightView.html().trim().length === 0) {
            self.$rightView.html('');
            LoadingBar.show();
            history.pushState(null, null, '/');
            
            $.get('/home', function(data) {
                self.$rightView.html(data);
            });
            LoadingBar.hide();
        }
    },
    
    fill: function() {
        var self = this,
            i = 0,
            artist = null,
            $spinner = self.$rightView.find('.spinner .inner');
        
        for (i; i < HomeScreen.artists.length; i += 1) {
            artist = HomeScreen.artists[i];
            switch (artist.type) {
                case 'soundcloud':
                    self.addSoundCloudProfile(artist, $spinner);
                    break;
                case 'youtube':
                    self.addYouTubeProfile(artist, $spinner);
                    break;
            }
        }
        $spinner.width(HomeScreen.artists.length * 550 - 50);
    },
    
    addSoundCloudProfile: function(artist, $spinner) {
        $.getJSON("http://api.soundcloud.com/users/" + artist.id + "/tracks.json?callback=?", {client_id: SOUNDCLOUD_API_KEY}, function(tracksData) {
            if (!tracksData) {
                return;
            }
            var results = Search.getVideosFromSoundCloudSearchData(tracksData),
            $tracklist = $('<table class="tracklist"/>');
            
            $.each(results, function(j, video) {
                if (j > 4) {
                    return false;
                }
                video.createListView()
                    .addClass('droppable')
                    .addClass('draggable')
                    .appendTo($tracklist);
            });
            HomeScreen.addView($tracklist, artist, $spinner);
        });
    },
    
    addYouTubeProfile: function(artist, $spinner) {
        $.getJSON('https://gdata.youtube.com/feeds/api/users/' + artist.id + '/uploads?callback=?', {alt: 'json-in-script', v: 2}, function(data) {
            if (data.feed.entry === undefined) {
                return;
            }
            var results = Search.getVideosFromYouTubeSearchData(data),
                $tracklist = $('<table class="tracklist"/>');
            
            $.each(results, function(j, video) {
                if (j > 4) {
                    return false;
                }
                video.createListView()
                    .addClass('droppable')
                    .addClass('draggable')
                    .appendTo($tracklist);
            });
            HomeScreen.addView($tracklist, artist, $spinner);
        });
    },
    
    addView: function($tracklist, artist, $spinner) {
        var $item = $('<div class="item"/>'),
            $left = $('<div class="left"/>'),
            $title = $('<div class="title"/>').text(artist.displayName),
            $img = $('<img/>'),
            $box = $('<div class="playlist-box"/>'),
            $tracklistContainer = $('<div class="tracklist-container minimized"/>');
        
        $tracklistContainer.append($tracklist);
        $box.append($tracklistContainer);
        $img.attr({'src': artist.img});
        $title.click(function() {
            ExternalUserPage.load(artist.type, artist.name);
        });
        $left.append($title);
        $left.append($img);
        $left.css({'background': artist.backgroundColor});
        $item.append($left);
        $item.append($box);
        $spinner.append($item);
    }
};
