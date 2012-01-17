
var SOPA = {
    init: function() {
        var date = new Date();
        if ((date.getFullYear() === 2012) && ((date.getMonth() + 1) === 1) && (date.getDate() === 18) && ((date.getHours() + 1) < 20)) {
            var $div = $('<div style="position: absolute; color: #FFF; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; text-align: center; background: rgba(0,0,0,0.95); font-size: 18px; font-weight: bold; "/>')
                .html('<p style="width: 600px; display: inline-block; margin: 50px 0;">This site has been blocked in protest of <br />the SOPA (Stop Online Piracy Act) and PIPA (Protect IP Act) <br />two bills which will allow the government censor the internet. <br />Find out more at <a href="http://americancensorship.org" target="_blank">americancensorship.org</a> or the video below.</p><br /><iframe src="http://player.vimeo.com/video/31100268?byline=0&amp;portrait=0" width="400" height="225" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe><p style="margin-top: 50px;"><a href="http://vimeo.com/31100268">PROTECT IP / SOPA Breaks The Internet</a></p><p>PS: We\'ll be back online at 8PM</p>');
            $div.appendTo($('body'));
        }
    }
}