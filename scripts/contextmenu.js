$(window).keyup(function (event) {
    if (event.keyCode === 27 && $('#contextmenu').length) {
        $('#context-menu-blocker, #contextmenu').remove();
    }
});

function showContextMenu(buttons, x, y) {
    var contextmenu = $('<ul id="contextmenu" />');

    $.each(buttons, function(i, item) {
        $('<li class="option" />')
            .text(item.title)
            .data('args', item.args)
            .data('callback', item.callback)
            .click(function() {
                $(this).data('callback')($(this).data('args'));
                $('#context-menu-blocker, #contextmenu').remove();
            })
            .appendTo(contextmenu);
    });

    // Set up a blocker div that closes the menu when clicked
    var blocker = $('<div id="context-menu-blocker" class="blocker"></div>').mousedown(function(event) {
        $('#context-menu-blocker, #contextmenu').remove();
        event.stopPropagation();
    });

    blocker.appendTo('body');
    contextmenu.appendTo('body');

	// Make sure contextmenu does not reach outside the window
	if ((y + contextmenu.height()) > $(window).height()) {
		y -= contextmenu.height();
	}
    if ((x + contextmenu.width()) > $(window).width()) {
        x -= contextmenu.width();
    }
    contextmenu.css({
        'top': y,
        'left': x
    });

    // Finally, prevent contextmenu on our contextmenu :)
    $('#context-menu-blocker, #contextmenu, #contextmenu li.option').bind('contextmenu', function (event) {
        event.preventDefault();
    });
}

function showPlaylistContextMenu(event) {
    $('#left .selected').removeClass('selected');
    $(this).addClass('selected');
    event.preventDefault();

    var buttons = [
		{
            title: 'Import from Spotify',
            args: $(this),
            callback: function(li) {
                li.arrowPopup('#spotify-importer', 'left');
            }
        },
        {
            title: 'Remove duplicate videos',
            args: $(this),
            callback: function(li) {
                var index = li.index(),
                    playlist = playlistManager.getPlaylist(index);
				if (confirm(translations['This will delete duplicate videos from your playlist. Continue?'])) {
					Notification.say(playlist.removeDuplicates() + translations[' duplicates removed.']);
				}
            }
        },
        {
            title: 'Rename',
            args: $(this),
            callback: function(li) {
                var input = $('<input type="text"/>')
                    .addClass('rename')
                    .val(li.text())
                    .data('li', li)
                    .blur(function(event) {
                        li.find('.title').show();
                        input.remove();
                    })
                    .keyup(function(event) {
                        switch (event.keyCode) {
                            case 13: // RETURN
                            var playlist = li.data('model');
                            playlist.rename(input.val());
                            playlistManager.save();
                            case 27: // ESC
                            $(this).blur();
                            break;
                        }
                        event.stopPropagation();
                    });

                li.find('.title').hide();
                li.append(input);
                input.focus().select();
            }
        },
        {
            title: 'Delete',
            args: $(this),
            callback: function(li) {
                var index = li.index(),
                    playlist = playlistManager.getPlaylist(index);

                if (confirm("Are you sure you want to delete this playlist (" + playlist.title + ")?")) {
                    playlistManager.deletePlaylist(index);
                    playlistManager.save();
                }
            }
        }
    ];

    if (logged_in && $(this).data('model').remoteId) {
        buttons.push({
            title: 'Share',
            args: $(this),
            callback: function(li) {
                showPlaylistSharePopup(li.data('model'), li, 'left');
            }
        });
    }

    if (logged_in && !$(this).data('model').remoteId) {
        buttons.push({
            title: 'Sync',
            args: $(this),
            callback: function(li) {
                li.data('model').sync(function() {
                    playlistManager.save();
                    li.addClass('remote');
                });
            }
        });
    }

    if (logged_in && $(this).data('model').remoteId) {
        buttons.push({
            title: 'Unsync',
            args: $(this),
            callback: function(li) {
                li.data('model').unsync();
                playlistManager.save();
                li.removeClass('remote');
            }
        });
    }

    if (ON_DEV) {
        buttons.push({
            title: 'View JSON',
            args: $(this),
            callback: function(li) {
                var playlist = li.data('model');
                alert(JSON.stringify(playlist.toJSON()));
                console.log(playlist.toJSON());
            }
        });
    }

    showContextMenu(buttons, event.pageX, event.pageY);
}

function showResultsItemContextMenu(event) {
    li = $(this);
    if (!$(li).hasClass('selected')) {
        li.parent().find('.selected').removeClass('selected');
        li.addClass('selected');
    }

    var allSelectedVideos = $(this).parent().find('.video.selected');

    var buttons = [
        {
            title: 'Play',
            args: $(this),
            callback: function(elem) {
                //li.play();
                elem.data('model').play();
            }
        },
        {
            title: 'Watch on YouTube',
            args: $(this),
            callback: function(elem) {
                window.open('http://www.youtube.com/watch?v=' + elem.data('model').videoId);
            }
        },
		/*{
            title: 'Queue',
            args: allSelectedVideos,
            callback: function(allSelectedVideos) {
                $.each(allSelectedVideos, function(index, li) {
                    li = $(li);
                    Player.addToPlayOrder(li);
                });
            }
        },*/
		{
			title: 'Share',
			args: $(this),
			callback: function(elem) {
                var video = $(elem).data('model');
                showVideoSharePopup(video.videoId, video.title, elem, 'up');
			}
		}
    ];

    if ($(this).data('additionalMenuButtons')) {
        buttons = $.merge(buttons, $(this).data('additionalMenuButtons'));
    }

    showContextMenu(buttons, (event.pageX || $(this).offset().left + $(this).width()) , (event.pageY || $(this).offset().top));

    return false;
}
