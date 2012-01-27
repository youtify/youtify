function webstore_Init() {
    if (ChromeWebStore.isBrowserChrome() && !ChromeWebStore.isAppInstalled()) {
        $('#top .menus .webstore').click(function() {
            $(this).arrowPopup('#webstore-popup');
        });

        $('#webstore-popup a').one('click', function(event) {
            event.preventDefault();
            ChromeWebStore.installApp();
        });
    } else {
        $('#top .menus .webstore').hide();
    }
}
var ChromeWebStore = {
    appLink: 'https://chrome.google.com/webstore/detail/ceimdjnelbadcaempefhdpdhdokpnbho',

    isBrowserChrome: function() {
        return navigator && navigator.userAgent && navigator.userAgent.indexOf('Chrome') !== -1;
    },

    isAppInstalled: function() {
        return window.chrome && window.chrome.app && window.chrome.app.isInstalled;
    },

    installApp: function() {
        var fail = function() {
                Notification.say('Failed to install App.');
            },
            success = function() {
                Notification.say('Installation succeded!');
                $('#top .menu .webstore').hide();
            };
        if (window.chrome && window.chrome.webstore) {
            window.chrome.webstore.install(ChromeWebStore.appLink, success, fail);
        } else {
            fail();
        }
    }
};
