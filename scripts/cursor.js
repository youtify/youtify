var Cursor = {
	_hidden: false,
	_timeOut: null,
	init: function() {
		$('body').mousemove(Cursor.onMove);
	},
	onMove: function() {
		if (Cursor._timeOut !== null) {
			clearTimeout(Cursor._timeOut);
		}
		if (Cursor._hidden === true) {
			$('#youtube-container').css('cursor', 'auto');
			Cursor._hidden = false;
		}
		if (Player._isFullscreen === true && Cursor._hidden === false) {
			Cursor._timeOut = setTimeout(function() {
				$('#youtube-container').css('cursor', 'none');
				Cursor._hidden = true;
			}, 500);
		}
	}
};
$(document).ready(function(){
	Cursor.init();
});