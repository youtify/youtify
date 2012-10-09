/**
 * Holds MenuItemGrops which in turn holds MenuItems. To add or edit a group,
 * see "#left .menu" in index.html.
 *
 * Also manages the "New playlist" button.
 */
var Menu = {
    $view: null,
    $loadingAnimation: null,
    selectedMenuItem: null,
    playingMenuItem: null,
    groups: {},

    init: function() {
        var self = this;
        this.$view = $('#left .menu');
        this.$loadingAnimation = this.$view.find('.loading-animation');

        // Hide playlists and extenral users and show loading animation until
        // they are finished loading.
        (function() {
            function done() {
                if (externalUsersLoaded && playlistsLoaded) {
                    self.$loadingAnimation.hide();
                    $('.group.playlists, .group.external-user-subscriptions').show();
                }
            }
            var externalUsersLoaded = false;
            var playlistsLoaded = false;

            if (UserManager.isLoggedIn()) {
                self.$loadingAnimation.show();
                $('.group.playlists, .group.external-user-subscriptions').hide();

                EventSystem.addEventListener('external_user_subscriptions_loaded', function() {
                    externalUsersLoaded = true;
                    done();
                });

                EventSystem.addEventListener('playlists_loaded', function() {
                    playlistsLoaded = true;
                    done();
                });
            }
        }());

        $.each(this.$view.find('.group'), function(i, $group) {
            $group = $($group);
            self.groups[$group.attr('rel')] = new MenuItemGroup($group);
        });

        $('#left .playlists .new span').click(this.newPlaylistClick);
        $('#left .playlists .new input').keyup(this.newPlaylistNameKeyUp);
        $('#left .playlists .new input').blur(this.newPlaylistNameBlur);
    },

    getPlayingMenuItem: function() {
        return this.playingMenuItem;
    },

    setAsNotPlaying: function() {
        if (this.playingMenuItem) {
            this.playingMenuItem.setAsNotPlaying();
        }
    },

    deSelect: function() {
        if (this.selectedMenuItem) {
            this.selectedMenuItem.deSelect();
        }
    },

    getGroup: function(relAttr) {
        if (this.groups.hasOwnProperty(relAttr)) {
            return this.groups[relAttr];
        }
        throw "Menu has no group named " + relAttr;
    },

    newPlaylistClick: function() {
        $(this).hide();
        $('#left .playlists .new input')
            .show()
            .focus()
            .select()
            .val('');
    },

    newPlaylistNameBlur: function() {
        $('#left .playlists .new span').show();
        $(this).hide();
    },

    newPlaylistNameKeyUp: function(event) {
        var title,
            playlist,
            videos = [];

        switch (event.keyCode) {
            case 13: // RETURN
                $('#left .playlists .new input').hide();
                $('#left .playlists .new span').show();

                title = $.trim($(this).val());
                if (title.length > 0 && title.length < 50) {
                    playlist = new Playlist($(this).val(), videos);
                    playlistManager.addPlaylist(playlist);
                    Menu.getGroup('playlists').addMenuItem(playlist.getMenuItem());
                    if (UserManager.isLoggedIn()) {
                        playlist.createNewPlaylistOnRemote(function() {
                            playlistManager.save();
                            playlist.getMenuItem().$view.addClass('remote');
                        });
                    } else {
                        playlistManager.save();
                    }
                } else {
                    return;
                }
                $(this).val('');
                break;
            case 27: // ESC
                $('#left .playlists .new input').hide();
                $('#left .playlists .new span').show();
                $(this).val('');
                break;
        }
        event.stopPropagation();
    }
};

/**
 * Group of MenuItems, e.g. playlists, subscriptions.
 */
function MenuItemGroup($view) {
    var self = this;

    self.$view = $view;
    self.$ul = $view.find('ul');
    self.menuItems = [];

    self.removeMenuItem = function(menuItem) {
        // @TODO remove that menu item from self.menuItems
        menuItem.$view.remove();
    };

    self.addMenuItem = function(menuItem) {
        self.menuItems.push(menuItem);
        self.$ul.append(menuItem.$view);
        menuItem.onAfterAdd();
    };

    self.clear = function() {
        self.menuItems = [];
        self.$ul.html('');
    };
}

/**
 * Menu item that, when clicked, shows a right $contentPane.
 */
function MenuItem(args) {
    var self = this;

    self.$view = $('<li/>');
    self.$contentPane = args.$contentPane;
    self.model = null;
    self.onSelected = args.onSelected;
    self.onContextMenu = args.onContextMenu;

    $('<span class="title"></span>').text(args.title).appendTo(self.$view);

    if (args.$img) {
        self.$view.append(args.$img);
    }

    $.each(args.cssClasses, function(i, cssClass) {
        self.$view.addClass(cssClass);
    });

    if (args.translatable) {
        self.$view.addClass('translatable');
    }

    self.onAfterAdd = function() {
        self.$view.mousedown(self.select);
        if (args.onContextMenu) {
            self.$view.bind('contextmenu', function(event) {
                self.select();
                return args.onContextMenu(self, event);
            });
        }
        if (args.model) {
            self.model = args.model;
            self.$view.data('model', args.model);
        }
    };

    self.isSelected = function() {
        return self === Menu.selectedMenuItem;
    };

    self.select = function() {
        $('#right, #top .search').removeClass('focused');
        $('#left').addClass('focused');

        if (Menu.selectedMenuItem) {
            Menu.selectedMenuItem.deSelect();
        }

        $('#right > div').hide();
        
        self.$view.addClass('selected');

        if (self.$contentPane) {
            self.$contentPane.show();
        }

        if (self.onSelected) {
            self.onSelected(self);
        }
        
        Utils.scrollRight();
        Menu.selectedMenuItem = self;
    };

    self.getModel = function() {
        return self.model;
    };

    self.deSelect = function() {
        self.$view.removeClass('selected');
        if (self.$contentPane) {
            self.$contentPane.hide();
        }
        if (Menu.selectedMenuItem === self) {
            Menu.selectedMenuItem = null;
        }
    };

    self.setAsNotPlaying = function() {
        self.$view.removeClass('playing');
        if (Menu.playingMenuItem === self) {
            Menu.playingMenuItem = null;
        }
    };

    self.setAsPlaying = function() {
        if (Menu.playingMenuItem) {
            Menu.playingMenuItem.setAsNotPlaying();
        }
        self.$view.addClass('playing');
        Menu.playingMenuItem = self;
    };

    self.setTitle = function(newTitle) {
        self.$view.find('.title').text(newTitle);
    };
}
