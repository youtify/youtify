var Utils = {
    /**
     * First do regular XML escaping on input text, after parse links into <a> tags.
     *
     * From http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
     */
    linkify: function(inputText) {
        if (inputText === undefined || inputText === null) {
            return '';
        }
        var replaceText, replacePattern1, replacePattern2, replacePattern3;

        replacedText = inputText;

        replacedText = replacedText.replace(/&/g, '&amp;');
        replacedText = replacedText.replace(/</g, '&lt;');
        replacedText = replacedText.replace(/>/g, '&gt;');

        //URLs starting with http://, https://, or ftp://
        replacePattern1 = /(\b(http?|https):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/gim;
        replacedText = replacedText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

        //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
        replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

        return replacedText;
    },

    shorten: function(inputText, limit) {
        var ret = inputText;

        if (ret.length > limit) {
            ret = ret.substr(0, limit-3);
            ret += '...';
        }

        return ret;
    },

    extractArtist: function(title) {
        if (title) {
            var parts = title.split('-');
            if (parts.length > 1) {
                return $.trim(parts[0]);
            }
        }
        return false;
    },

    deSelectSelectedVideos: function() {
        var i;
        for (i = 0; i < selectedVideoElements.length; i += 1) {
            selectedVideoElements[i].removeClass('selected');
        }
    }
};
