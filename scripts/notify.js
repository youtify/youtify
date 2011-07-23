$(window).ajaxError(function() {
    Notification.show('Connection error!');
});

$(document).ready(function() {
	$('#notification').click( Notification.hide );
});

var Notification = {
	show: function(message) {
		$('#notification span').text(message);
		
		if (!$('#notification').is(':visible'))
			$('#notification').slideDown();	
	},
	hide: function() {
		if ($('#notification').is(':visible'))
			$('#notification').slideUp('normal');
	}
};

var Publishers = [
	{
        uploaderRegEx: '(^[\w]+[VEVO])',
        twitter: '@vevo',
        name: 'VEVO'
    }
];
