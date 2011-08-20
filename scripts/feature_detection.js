var CSSDetect = function() {  
    var 
        props = ["textShadow", "boxShadow", "borderRadius", "opacity"], 
        CSSprefix = ["Webkit", "Moz", "O", "ms", "Khtml"], 
        d = document.createElement("detect"), 
        test = [], 
        p, pty; 
    // test prefixed code  
    function TestPrefixes(prop) { 
        var 
            n, np,
            Uprop = prop.charAt(0).toUpperCase() + prop.substr(1), 
            All = (prop + ' ' + CSSprefix.join(Uprop + ' ') + Uprop).split(' '); 
        for (n = 0, np = All.length; n < np; n++) { 
            if (d.style[All[n]] === "") {
                return true; 
            }
        } 
        return false; 
    } 
    for (p in props) { 
        pty = props[p]; 
        if (new TestPrefixes(pty) === false) {
			return false;
        }
    }
    return true;
};

var JSDetect = function() {
	var list = [
		localStorage, 
		history.pushState,
		JSON.parse,
		JSON.stringify
	], i;
	for (i = 0; i < list.length; i++) {
		//alert('typeof ' + typeof list[i]);
		if (typeof list[i] === 'undefined') {
			return false;
		}
	}
	return true;
};

function checkBrowser() {
	if (new CSSDetect() === false || new JSDetect() === false) {
		window.location = '/yourbrowsersucks';
        return false;
	} else {
        return true;
    }
}
checkBrowser();