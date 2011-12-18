function notification_Init() {
	$('.notifications .close').live('click', function(event) { 
        var parent = $(this).parent(); 
        parent.addClass('hidden');
        setTimeout(function() { parent.remove(); }, 1000);
    });

    EventSystem.addEventListener('video_info_fetched', function(info) {
        Notification.say(info.title);
    });
}

var Notification = {
	say: function(message) {
		if (Notification.useWebkitNotifications()) {
            Notification.webkitSay(message);
        } else {
            var settings = new Settings(),
                notification = $('<li/>'),
                content = $('<div class="content"/>').text(message),
                close = $('<span class="close"/>').text('X');
            content.appendTo(notification);
            close.appendTo(notification);    
            notification.appendTo('#top .notifications');
            
            setTimeout(function() { 
                notification.find('.close').click(); 
            }, settings.announceTimeout);
        }
	},
    useWebkitNotifications: function() {
        if (window.webkitNotifications) {
            return (window.webkitNotifications.checkPermission() < 2);
        } else {
            return false;
        }
    },
	webkitSay: function(message) {
        var announceFunction = (function(message) {
            try
            {
                var settings = new Settings();
                var popup = window.webkitNotifications.createNotification(
                    '/images/logo32x32.png',
                    'Youtify',
                    message);
                popup.show();
                setTimeout(function(){ popup.cancel(); }, settings.announceTimeout);
            } catch(err) {
                console.log(err.message);
            }
        });
		if (window.webkitNotifications) {
			if (window.webkitNotifications.checkPermission() === 1) { // 0=OK, 1=Not Allowed, 2=Denied
				window.webkitNotifications.requestPermission(function() { 
					announceFunction(message); 
				});
			} else { 
				announceFunction(message); 
			}
		}
	},
	error: function(message) {
		try {
			Player.pause();
		} catch (err) { }

        $('#device-error-popup button').one('click', function(){ 
            location.reload();
        });

        $('#device-error-popup p').text(message);
        $('#device-error-popup').show();
	}
};
