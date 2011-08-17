$(window).keyup(function (event) {
    if (event.keyCode === 27 && $('#contextmenu').length) {
        $('#context-menu-blocker, #contextmenu').remove();
    }
});

function showContextMenu(buttons, event) {
    var contextmenu = $('<ul id="contextmenu" />')
        .css({
            'top': event.pageY,
            'left': event.pageX
        });

    $.each(buttons, function(i, item) {
        $('<li class="option" />')
            .text(item.title)
            .data('li', item.li)
            .data('callback', item.callback)
            .click(function() {
                $(this).data('callback')($(this).data('li'));
                $('#context-menu-blocker, #contextmenu').remove();
            })
            .appendTo(contextmenu);
    });
	
	// Move menu if it overflows
	var bottom = parseInt(contextmenu.css('top')) + (30*buttons.length);
	var diff = bottom - $(window).height();
	if (diff > 0)
		contextmenu.css('top', parseInt(contextmenu.css('top')) - diff + 'px');	
	
    // Set up a blocker div that closes the menu when clicked
    var blocker = $('<div id="context-menu-blocker"></div>').mousedown(function(event) {
        $('#context-menu-blocker, #contextmenu').remove();
        event.stopPropagation();
    });

    blocker.appendTo('body');
    contextmenu.appendTo('body');

    // Finally, prevent contextmenu on our contextmenu :)
    $('#context-menu-blocker, #contextmenu, #contextmenu li.option').bind('contextmenu', function (event) {
        event.preventDefault();
    });
}

function showPlaylistContextMenu(event) {
    event.preventDefault();

    var buttons = [
		{
            title: 'Import from Spotify',
            li: $(this),
            callback: function(li) {
                li.arrowPopup('#spotify-importer', 'left');
            }
        },
        {
            title: 'Remove duplicate videos',
            li: $(this),
            callback: function(li) {
                var index = li.index();
                    playlist = playlistManager.getPlaylist(index);
				if (confirm(translations['This will delete duplicate videos from your playlist. Continue?'])) {
					Notification.show(playlist.removeDuplicates() + translations[' duplicates removed.']);
				}
            }
        },
        {
            title: 'Rename',
            li: $(this),
            callback: function(li) {
                var input = $('<input type="text"/>')
                    .addClass('rename')
                    .val(li.text())
                    .data('original', li.text())
                    .data('li', li)
                    .blur(function(event) {
                        li.text($(this).data('original'));
                        input.remove();
                    })
                    .keyup(function(event) {
                        switch (event.keyCode) {
                            case 13: // RETURN
                            input.remove();
                            var playlist = li.data('model');
                            playlist.rename(input.val());
                            playlistManager.save();
                            constructPlaylistsMenu();
                            break;
                            case 27: // ESC
                            $(this).blur();
                            break;
                        }
                        event.stopPropagation();
                    });

                li.html('');
                li.append(input);
                input.focus().select();
            }
        },
        {
            title: 'Delete',
            li: $(this),
            callback: function(li) {
                var index = li.index();
                    playlist = playlistManager.getPlaylist(index);

                if (confirm("Are you sure you want to delete this playlist (" + playlist.title + ")?")) {
                    playlistManager.deletePlaylist(index);
                    playlistManager.save();
                    constructPlaylistsMenu();
                }
            }
        }
    ];

    if (logged_in && $(this).data('model').remoteId) {
        buttons.push({
            title: 'Share',
            li: $(this),
            callback: function(li) {
                showPlaylistSharePopup(li.data('model'), li, 'left');
            }
        });
    }

    if (logged_in && !$(this).data('model').remoteId) {
        buttons.push({
            title: 'Sync',
            li: $(this),
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
            li: $(this),
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
            li: $(this),
            callback: function(li) {
                var playlist = li.data('model');
                alert(JSON.stringify(playlist.toJSON()));
                console.log(playlist.toJSON());
            }
        });
    }

    showContextMenu(buttons, event);
}

function showResultsItemContextMenu(event) {
    event.preventDefault();

    var buttons = [
        {
            title: 'Watch on YouTube',
            li: $(this),
            callback: function(li) {
                window.open('http://www.youtube.com/watch?v=' + li.data('videoId'));
            }
        },
		{
            title: 'Queue',
            li: $(this),
            callback: function(li) {
                Player.addToPlayOrder(li);
            }
        },
		{
			title: 'Show related',
			li: $(this),
			callback: function(li) {
				$('#results').html('');
				var videoId = li.data('videoId');
				var url = "http://gdata.youtube.com/feeds/api/videos/" + videoId + "/related?callback=?";
				var params = {
					'alt': 'json-in-script',
					'max-results': 50,
					'prettyprint': true,
					'v': 2
				};
				$.getJSON(url, params, function(data) {
					$.each(data.feed.entry, function(i, item) {
						var url = item['id']['$t'];
						var videoId = url.match('video:(.*)$')[1];
						var title = item['title']['$t'];
						if (item['gd$rating'])
							var rating = item['gd$rating']['average'];
						var resultItem = createResultsItem(title, videoId, rating);
						resultItem.appendTo($('#results'));
					}); 
				});
				Search.selectSearchResults();
			}
		},
		{
			title: 'Share',
			li: $(this),
			callback: function(li) {
                var videoId = li.data('videoId');
                var title = $.trim(li.find('.title').text());
                var elem = li.find('.title');
                showVideoSharePopup(videoId, title, elem, 'up');
			}
		}
    ];

    buttons = $.merge(buttons, $(this).data('additionalMenuButtons'));

    showContextMenu(buttons, event);
}
