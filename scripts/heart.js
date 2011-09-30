function heart_Init() {
	Heart.init();
}

var Heart = {
	htmlLoaded: false,
	init: function() {
		$('#heart').click(function() {
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
					$('#heartPopup').html(data);
					$('#heartPopup iframe').css('height', '62px').css('width', '55px');

                    // FUNNY LOGO
                    $('#heartPopup .logo').click(function() {
                        Player.play(Player._hiddenPlaylist[new Date().getWeek()]);
                    });
				}
			}
		});
	},
	show: function() {
		$('#heart').arrowPopup('#heartPopup');
	},
	hide: function() {
		$('#heartPopup').hide();
	}
};
