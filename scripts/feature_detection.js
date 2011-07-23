var CSSDetect = function() {  
    var 
        props = "textShadow,boxShadow,borderRadius,opacity".split(","), 
        CSSprefix = "Webkit,Moz,O,ms,Khtml".split(","), 
        d = document.createElement("detect"), 
        test = [], 
        p, pty; 
    // test prefixed code  
    function TestPrefixes(prop) { 
        var 
            Uprop = prop.charAt(0).toUpperCase() + prop.substr(1), 
            All = (prop + ' ' + CSSprefix.join(Uprop + ' ') + Uprop).split(' '); 
        for (var n = 0, np = All.length; n < np; n++) { 
            if (d.style[All[n]] === "") return true; 
        } 
        return false; 
    } 
    for (p in props) { 
        pty = props[p]; 
        if (TestPrefixes(pty) === false)
			return false;
    }
    return true;
};

var JSDetect = function() {
	var list = [
		localStorage, 
		history.pushState,
		JSON.parse,
		JSON.stringify
	];
	for (var i = 0; i < list.length; i++) {
		//alert('typeof ' + typeof list[i]);
		if (typeof list[i] === 'undefined') {
			return false;
		}
	}
	return true;
};

function checkBrowser() {
	if (!CSSDetect() || !JSDetect()) {
		window.location = '/yourbrowsersucks';
	}
	var playerVersion = swfobject.getFlashPlayerVersion();
	if (!playerVersion || parseInt(playerVersion.major) < 10) {
		window.location = '/yourdecisionrocks';
	}
};
checkBrowser();