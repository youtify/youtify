$(document).ajaxError(function (e, r, ajaxOptions, thrownError) {
    if ($.trim(r.responseText).length > 0) {
        if (ON_PRODUCTION) {
            alert(r.responseText);
        } else {
            $('body').html(r.responseText);
        }
    }
});

Date.prototype.getWeek = function (dowOffset) {
	/*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */
	dowOffset = typeof(dowOffset) == 'int' ? dowOffset : 0; //default dowOffset to zero
	var newYear = new Date(this.getFullYear(),0,1);
	var day = newYear.getDay() - dowOffset; //the day of week the year begins on
	day = (day >= 0 ? day : day + 7);
	var daynum = Math.floor((this.getTime() - newYear.getTime() - (this.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
	var weeknum;
	//if the year starts before the middle of a week
	if(day < 4) {
		weeknum = Math.floor((daynum+day-1)/7) + 1;
		if(weeknum > 52) {
			nYear = new Date(this.getFullYear() + 1,0,1);
			nday = nYear.getDay() - dowOffset;
			nday = nday >= 0 ? nday : nday + 7;
			/*if the next year starts before the middle of
			the week, it is week #1 of that year*/
			weeknum = nday < 4 ? 1 : 53;
		}
	} else {
		weeknum = Math.floor((daynum+day-1)/7);
	}
	return weeknum;
};

function toggle(feed, parameters) {
	var event = parameters['event'];
	var playlist = parameters['playlist'];

	if (playlist.find('ul').length) {
		playlist.find('ul').toggle();
	} else {
		$('<ul/>').appendTo($(playlist));
		if (feed) {
			$.each(feed, function(i, item) { 
                var videoId = item['media$group']['yt$videoid']['$t'];
                var title = item['title']['$t'];
                createResultsItem(title, videoId).appendTo(playlist.find('ul'));
            });
		}
	}
}

function getVidsInPlaylist(playlistId, callback, parameters, start, feed) {
	if (!parameters['playlist'].hasClass('loading')) {
		parameters['playlist'].addClass('loading')
    }
	if (start === undefined) {
		start = 1;
    }
	if (feed === undefined) {
		feed = [];
    }
    var url = 'http://gdata.youtube.com/feeds/api/playlists/' + playlistId + '?start-index='+start+'&max-results=50&v=2&alt=json&callback=?';
    $.getJSON(url, {}, function(data) {
		if (data.feed.entry && data.feed.entry.length > 0) {
			feed = $.merge(feed, data.feed.entry);
			getVidsInPlaylist(playlistId, callback, parameters, start+50, feed);
		} else {
			callback(feed, parameters);
			parameters['playlist'].removeClass('loading');
		}
    });
}

// -webkit-calc is not working
$(window).resize(function() {
	var windowHeight = $(window).height();
	var windowWidth = $(window).width();
	if (windowWidth < 650) {
		windowWidth = 650;
    }

    // height
	$('#content').height(windowHeight);

	var leftMenuSiblingHeights = 0;
	$('#left-menu').siblings().each(function(index, item) {
        leftMenuSiblingHeights += $(item).height();
    });
	$('#left-menu').height(windowHeight - leftMenuSiblingHeights);
	
	var resultsContainerSiblingsHeights = 0;
	$('#results-container').siblings(':visible').each(function(index, item) {
        resultsContainerSiblingsHeights += $(item).height();
    });
	$('#results-container').height(windowHeight - resultsContainerSiblingsHeights);
	
    // width
	$('#content-right').width(windowWidth - $('#content-left').width());
	$('#timeline-container').width($('#content-right').width());
	$('#timeline').width($('#content-right').width() - 102);
	
	if (Player._isFullscreen) {
		Player.startFullscreen();
	} else {
		var offset = $('#youtube-container').offset();
		$('#youtube').css('left', offset.left);
		$('#youtube').css('top', offset.top);
	}
});

$(window).load(function() {
	$(window).resize();
	$('#loading span').text('Done');
	$('#loading').fadeOut();
	
	// LOAD VIDEO?
	var pathname = document.location.pathname.split('/'); // '/videos/123'
	if (pathname.length === 3 && pathname[1] === 'videos') {
		Player.play(pathname[2]);
	}
});

$(document).ready(function() {
    var settings = new Settings();

    $('#info .title').data('type', 'video');
    $('#new-playlist').data('type', 'button');

    changeTheme(settings.theme);
	
	// Legal & Information
	$('#infomenu-text').click(function() {
        var blocker = $('<div id="blocker"></div>').mousedown(function(event) {
            $('#blocker').remove();
            $('#infomenu-popup').hide();
            event.stopPropagation();
        });
        blocker.appendTo('body');
        $('#infomenu-popup').show();
    });

	// CONTROLS
	$('#playpause').click(Player.playPause);
	$('#next').click(Player.next);
	$('#prev').click(Player.prev);
	
	// FULLSCREEN
	$('#fullscreen').click(function() {
		Player.toggleFullscreen();
	});
		
	// TIMELINE
	$('#timeline').click(Player.timelineClick);
	
	// ABOUT
	$('#about-link').click(function() {
		$('#about-box').show();
		$('#about-box').click(function() {
			$('#about-box').hide();
		});
	});
	
	// FUNNY LOGO
	$('#logo').click(function() {
		Player.play(Player._hiddenPlaylist[new Date().getWeek()]);
	});

	// Initially show Top 100
    TopList.select();
	
	//Notification.show('We are experiencing connection issues with YouTube at the moment. Sorry for the inconvenience.');
});

function onYouTubePlayerAPIReady() {
	// 
	// Player cannot be loaded before
	// $(window).load()
}
