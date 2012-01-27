function fatBar_Init() {
    $('#fatbar-toggle .show').click(FatBar.show);
    $('#fatbar-toggle .hide').click(FatBar.hide);

    $('#fatbar .close').click(FatBar.hide);

    if (JSON.parse(localStorage['fatbar-toggle'] || "false")) {
        FatBar.show();
    } else {
        FatBar.hide();
    }
}

/**
 * First do regular XML escaping on input text, after parse links into <a> tags.
 *
 * From http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
 */
function linkify(inputText) {
    var replaceText, replacePattern1, replacePattern2, replacePattern3;

    replacedText = inputText;

    replacedText = replacedText.replace(/&/g, '&amp;');
    replacedText = replacedText.replace(/</g, '&lt;');
    replacedText = replacedText.replace(/>/g, '&gt;');

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(http?|https):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = replacedText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    return replacedText;
}

var FatBar = {
    _lastLoadedVideoId: null,
	loadFromVideo: function(video) {
        if (video.videoId !== FatBar._lastLoadedVideoId) {
            FatBar._lastLoadedVideoId = video.videoId;
            FatBar._loadVideoInfo(video);
            FatBar._loadRelatedInfo(video);
            FatBar._loadLinkosBox(video);
        }
	},
    clear: function() {
		$('#video-info-box .uploader').text('');
		$('#video-info-box .description').text('');
		$('#video-info-box span').hide();

		$('#related').html('');

        $('#linko-box .name').text('');
        $('#linko-box .links').html('');
    },
    show: function() {
        if (player && player.getCurrentVideo()) {
            FatBar.loadFromVideo(player.getCurrentVideo());
        }
        $("#fatbar-toggle .show").hide();
        $("#fatbar-toggle .hide").show();
        $("#fatbar").show();
        localStorage['fatbar-toggle'] = JSON.stringify(true);
        $(window).resize();
    },
    hide: function() {
        $("#fatbar-toggle .show").show();
        $("#fatbar-toggle .hide").hide();
        $("#fatbar").hide();
        localStorage['fatbar-toggle'] = JSON.stringify(false);
        $(window).resize();
    },
    isVisible: function() {
        return $('#fatbar').is(':visible');
    },
	_loadRelatedInfo: function(video) {
		$('#related-box').addClass('loading');
		$('#related').show();
		var url = "http://gdata.youtube.com/feeds/api/videos/" + video.videoId + "/related?callback=?";
		var params = {
			'alt': 'json-in-script',
			'max-results': 9,
			'prettyprint': true,
			'v': 2
		};
		$.getJSON(url, params, function(data) {
            $('#related-box').removeClass('loading');
			$.each(data.feed.entry, function(i, item) {
				var url = item.id.$t;
				var videoId = url.match('video:(.*)$')[1];
				var title = item.title.$t;
				if (item.gd$rating) {
					var rating = item.gd$rating.average;
                }
				var resultItem = new Video(videoId, title, 'youtube', rating).createListView();
				resultItem.appendTo($('#related'));
			}); 
		});
	},
	_loadVideoInfo: function(video) {
		$('#video-info-box').addClass('loading');
		var url = "http://gdata.youtube.com/feeds/api/videos/" + video.videoId + "?callback=?";
		var params = {
			'alt': 'json-in-script',
			'prettyprint': true,
			'v': 2
		};
		$.getJSON(url, params, function(data) {
            $('#video-info-box').removeClass('loading');
            $('#video-info-box span').show();
			var author = data.entry.author[0].name.$t;
			var title = data.entry.title.$t;
			var uri = data.entry.author[0].uri.$t;

            if (title !== video.title) {
                // @todo: do this even when FatBar is not showing
                renameCurrentlyPlayingVideo(title);
            }

            try {
                var description = data.entry.media$group.media$description.$t;
                $('#video-info-box .description').html(linkify(description));
            } catch (e) {
            }
			$('#video-info-box .uploader')
                .unbind('click')
				.click(function() {
					Uploader.loadVideosFromURI(uri);
				})
				.text(author);
		});
	},
    _loadLinkosBox: function(video) {
        var artist = extractArtist(video.title);
        if (artist) {
            $('#linko-box').addClass('loading');
            var url = 'http://linko.fruktsallad.net/artist/' + (artist.replace(/ /g, '_')) + '.json?callback=?';
            $.getJSON(url, {}, function(data) {
                $('#linko-box').removeClass('loading');

                if (!data || !data.links || !data.hasOwnProperty('artist_name')) {
                    return;
                }

                $('#linko-box .name').text(data.artist_name);

                var key;
                for (key in data.links) {
                    if (data.links.hasOwnProperty(key)) {
                        var url = data.links[key],
                            li = $('<li></li>'),
                            a = $('<a target="_blank"></a>').attr('href', url).text(key);

                        a.appendTo(li);
                        li.appendTo($('#linko-box .links'));
                    }
                }
            });
        }
    }
};
