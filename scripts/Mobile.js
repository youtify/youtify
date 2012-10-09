
// https://gist.github.com/1172490

var Mobile = {
    elements: null,
    lastWidth: 0,
    iphone: (navigator.userAgent.indexOf('iPhone') >= 0 || navigator.userAgent.indexOf('iPod') >= 0) || false,
    ipad: navigator.userAgent.indexOf('iPad') >= 0 || false,
    ios: null,
    // Detect if this is running as a fullscreen app from the homescreen
    fullscreen: window.navigator.standalone,
    android: ~navigator.userAgent.indexOf('Android'),
    
    init: function() {
        $('#top .go-left').click(Utils.scrollLeft).hide();
        $('#top .go-right').click(Utils.scrollRight);
    
        Mobile.ios = Mobile.iphone || Mobile.ipad;
        Mobile.elements = $('body, .left-wrapper, #left, .right-wrapper, #right');
        
        if (Mobile.android) {
            // Android's browser adds the scroll position to the innerHeight, just to
            // make this really fucking difficult. Thus, once we are scrolled, the
            // page height value needs to be corrected in case the page is loaded
            // when already scrolled down. The pageYOffset is of no use, since it always
            // returns 0 while the address bar is displayed.
            window.onscroll = function() {
                Mobile.elements.height(window.innerHeight + 'px');
            };
        }
        window.onresize = Mobile.resize;
        Mobile.setHeight();
    },
    resize: function() {
        /*var pageWidth = $('body')[0].offsetWidth;
        // Android doesn't support orientation change, so check for when the width
        // changes to figure out when the orientation changes
        if (Mobile.lastWidth === pageWidth) {
            return;
        }
        Mobile.lastWidth = pageWidth;*/
        Mobile.setHeight();
    },
    setHeight: function() {
        // Start out by adding the height of the location bar to the width, so that
        // we can scroll past it
        if (Mobile.ios) {
            // iOS reliably returns the innerWindow size for documentElement.clientHeight
            // but window.innerHeight is sometimes the wrong value after rotating
            // the orientation
            var height = document.documentElement.clientHeight;
            // Only add extra padding to the height on iphone / ipod, since the ipad
            // browser doesn't scroll off the location bar.
            if (Mobile.iphone && !Mobile.fullscreen) {
                height += 60;
            }
            Mobile.elements.height(height + 'px');
        } else if (Mobile.android) {
            // The stock Android browser has a location bar height of 56 pixels, but
            // this very likely could be broken in other Android browsers.
            Mobile.elements.height((window.innerHeight + 56) + 'px');
        }
        // Scroll after a timeout, since iOS will scroll to the top of the page
        // after it fires the onload event
        setTimeout(scrollTo, 0, 0, 1);
    }
};