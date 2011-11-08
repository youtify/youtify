function webstore_Init() {
    ChromeWebStore.suggestInstall();
}
var ChromeWebStore = {
    appLink: 'https://chrome.google.com/webstore/detail/ceimdjnelbadcaempefhdpdhdokpnbho',
    suggestInstall: function() {
        if (ChromeWebStore.isBrowserChrome() && !ChromeWebStore.isAppInstalled()) {
            Notification.say('Youtify is available as an app in Chrome Web Store. Do you want to install it? <input type="button" onclick="javascript:event.stopPropagation();ChromeWebStore.installApp();" value="Install" />');
        }
    },
    isBrowserChrome: function() {
        return navigator && navigator.userAgent && navigator.userAgent.indexOf('Chrome') != -1;
    },
    isAppInstalled: function() {
        return window.chrome && window.chrome.app && window.chrome.app.isInstalled;
    },
    installApp: function() {
        var fail = function() {
            console.log(arguments);
            Notification.say('Failed to install App. Please visit <a href="' + ChromeWebStore.appLink + '" target="_blank">Chrome Web Store</a> for installation.');
        }
        var success = function() {
            Notification.say('Installation succeded!');
        }
        if (window.chrome && window.chrome.webstore) {
            window.chrome.webstore.install(ChromeWebStore.appLink, success, fail);
        } else {
            fail();
        }
    }
};
