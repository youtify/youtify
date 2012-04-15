/* Make sure parent obj is set before testing child functions */
var JSON = JSON || {};

var FeatureDetection = {
    cssPrefix: ["Webkit", "Moz", "O", "ms", "Khtml"],
    cssStylesToTest: ["textShadow", "boxShadow", "borderRadius", "opacity"],
    cssStylesFailed: [],
    cssTestElem: document.createElement("detect"),
    jsFunctionsToTest: [localStorage, history.pushState, JSON.parse, JSON.stringify],
    jsFunctionNames: ['localStorage', 'history.pushState', 'JSON.parse', 'JSON.stringify'],
    jsFunctionsFailed: [],
    
    init: function() {
        var i, obj, title;
        for (i = 0; i < FeatureDetection.cssStylesToTest.length; i += 1) {
            obj = FeatureDetection.cssStylesToTest[i];
            if (new FeatureDetection.testPrefixes(obj) === false) {
                FeatureDetection.cssStylesFailed.push(i);
            }
        }
        for (i = 0; i < FeatureDetection.jsFunctionsToTest.length; i += 1) {
            obj = FeatureDetection.jsFunctionsToTest[i];
            if (typeof obj === 'undefined') {
                FeatureDetection.jsFunctionsFailed.push(i);
            }
        }
    },
    testPrefixes: function(prop) {
        var n, np,
            Uprop = prop.charAt(0).toUpperCase() + prop.substr(1),
            All = (prop + ' ' + FeatureDetection.cssPrefix.join(Uprop + ' ') + Uprop).split(' ');
        for (n = 0, np = All.length; n < np; n += 1) {
            if (FeatureDetection.cssTestElem.style[All[n]] === "") {
                return true;
            }
        }
        return false;
    },
    checkBrowser: function() {
        if (FeatureDetection.cssStylesFailed.length > 0 ||
            FeatureDetection.jsFunctionsFailed.length > 0) {
            window.location = '/yourbrowsersucks';
            return false;
        } else {
            return true;
        }
    }
};
