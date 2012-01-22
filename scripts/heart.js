function heart_Init() {
	Heart.init();
}

var Heart = {
	htmlLoaded: false,
	init: function() {
		$('#top .heart').click(function() {
			Heart.show();
			if (!Heart.htmlLoaded) {
				Heart.loadHTML();
			}
		});
	},
	loadHTML: function() {
		$.ajax({
			url: '/heart',
			statusCode: {
				200: function(data) {
					Heart.htmlLoaded = true;
					$('#heart-popup').html(data);
					$('#heart-popup iframe').css('height', '62px').css('width', '55px');

                    // FUNNY LOGO
                    $('#heart-popup .logo').click(function() {
                        player.play(new Video(player._hiddenPlaylist[new Date().getWeek()]));
                    });
				}
			}
		});
	},
	show: function() {
		$('#top .heart').arrowPopup('#heart-popup');
	},
	hide: function() {
		$('#heart-popup').hide();
	}
};
