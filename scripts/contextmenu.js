$(window).keyup(function (event) {
    if (event.keyCode === 27 && $('#contextmenu').length) {
        $('#blocker, #contextmenu').remove();
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
                $('#blocker, #contextmenu').remove();
            })
            .appendTo(contextmenu);
    });
	
	// Move menu if it overflows
	var bottom = parseInt(contextmenu.css('top')) + (30*buttons.length);
	var diff = bottom - $(window).height();
	if (diff > 0)
		contextmenu.css('top', parseInt(contextmenu.css('top')) - diff + 'px');	
	
    // Set up a blocker div that closes the menu when clicked
    var blocker = $('<div id="blocker"></div>').mousedown(function(event) {
        $('#blocker, #contextmenu').remove();
        event.stopPropagation();
    });

    blocker.appendTo('body');
    contextmenu.appendTo('body');

    // Finally, prevent contextmenu on our contextmenu :)
    $('#blocker, #contextmenu, #contextmenu li.option').bind('contextmenu', function (event) {
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
				li.find('.spotify-importer').remove();
				li.removeClass('draggable');
				var div = $('#spotify-importer')
					.clone()
					.addClass('spotify-importer')
                    .bind('contextmenu', function(event) {
                        event.stopPropagation();
                    })
					.click(function(event) {
						event.stopPropagation();
					});
				li.append(div);
				div.show();
				var importer = new SpotifyImporter();
				
				// cancel
				li.find('.spotify-importer .cancel').one('click', function() {
					importer.cancel();
					li.find('.spotify-importer').fadeOut('normal', function() { 
						li.find('.spotify-importer').remove(); 
					});
					li.addClass('draggable');
				});
				
				// start
				li.find('.spotify-importer .start').one('click', function() {
					importer.start(
						li.find('.spotify-importer textarea').val(), 
						li.data('model'), 
						function() {
							// callbackUpdate
							// li.click();
							li.find('.spotify-importer .added').text(importer.added);
							li.find('.spotify-importer .max').text('/'+importer.max);
						}, 
						function() {
							// callbackDone
							li.find('.spotify-importer').fadeOut('normal', function() { 
								li.find('.spotify-importer').remove(); 
							});
							li.click();
							li.addClass('draggable');
						}
					); 
				});
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
				var videoTag = li.data('videoId');
				$('#results').html('');
				var url = "http://gdata.youtube.com/feeds/api/videos/" + videoTag + "/related?callback=?";
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
		}
    ];

    buttons = $.merge(buttons, $(this).data('additionalMenuButtons'));

    showContextMenu(buttons, event);
}
