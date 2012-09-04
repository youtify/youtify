var Notifications = {
    numberOfClicks: 0,
    init: function() {
        $('.notifications .close').live('click', function(event) {
            var parent = $(this).parent();
            parent.addClass('hidden');
            setTimeout(function() { parent.remove(); }, 1000);
        });

        EventSystem.addEventListener('video_info_fetched', function(info) {
            Notifications.append(info.title);
        });
    },
    requestPermission: function() {
        if (window.webkitNotifications) {
            if (window.webkitNotifications.checkPermission() === 1) { // 0=OK, 1=Not Allowed, 2=Denied
                window.webkitNotifications.requestPermission();
            }
        }
    },
	append: function(message) {
		if (window.webkitNotifications && window.webkitNotifications.checkPermission() < 2) {
            Notifications._webkitAppend(message);
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
	_webkitAppend: function(message) {
        var announceFunction = function(message) {
            try
            {
                var settings = new Settings();
                var popup = window.webkitNotifications.createNotification(
                    '/images/logo/logo_32x32.png',
                    'Youtify',
                    message);
                popup.show();
                popup.onclick = function() {
                    window.focus();
                    popup.cancel();
                };
                setTimeout(function(){ popup.cancel(); }, settings.announceTimeout);
            } catch(err) {
                console.log(err.message);
            }
        };
		if (window.webkitNotifications && window.webkitNotifications.checkPermission() === 0) {
			// 0=OK, 1=Not Allowed, 2=Denied
            announceFunction(message);
		}
	}
};
