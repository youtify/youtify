function queue_Init() {
	$('#queue-tab').click(function() {
		Queue.select();
	});
	$('#queue-tab').hide();
}

var Queue = { 
	select: function() {
		$('#left-menu li').removeClass('selected');
		$('#queue-tab').addClass('selected');
		$('#results-container ol').hide();
		Queue.updateView();
		$('#queue').show();
	},
	updateView: function() {
		var q = $('#queue').html('');
		var i;
		for (i = 0; i < Player._queue.length; i++) {
			$(Player._queue[i]).clone().appendTo(q);
		}
		for (i = 0; i < Player._playOrderList.length; i++) {
			$(Player._playOrderList[i]).clone().appendTo(q);
		}
	}
}