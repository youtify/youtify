var HomeScreen = {
    $rightView: null,
    menuItem: null,
    nbrOfArtists: 0,
    
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
        history.pushState(null, null, '/');
        HomeScreen.fill();
    },
    
    fill: function() {
        var self = this,
            i = 0,
            artist = null,
            $spinner = self.$rightView.find('.spinner .inner'),
            /* workaround for jquery width bug: http://bugs.jquery.com/ticket/9945 */
            width = ($('#right .home').width() - 320) * 1.15, 
            itemWidth = 88,
            rows = 3,
            nbrOfArtists = 0;
        width = width < 528 ? 528 : width;
        nbrOfArtists = Math.ceil(width/itemWidth) * rows;
        
        if (self.nbrOfArtists === nbrOfArtists) {
            return;
        } else {
            self.nbrOfArtists = nbrOfArtists;
            $spinner.html('');
        }
        
        $.getJSON('/api/external_users/top/' + nbrOfArtists, function(data) {
            $.each(data, function(i, externalUser) {
                var $item = $('<div class="item"/>'),
                    $title = $('<div class="title"/>'),
                    image = new Image();
                if (externalUser.avatar_url) {
                    image.onload = function() {
                        $item.css({'opacity': '1'});
                    };
                    image.src = externalUser.avatar_url;
                    $item.css({'background-image': 'url('+ externalUser.avatar_url + ')'});
                }
                $title.text(externalUser.username);
                $item.append($title);
                $spinner.append($item);
            });
        });
    }    
};
