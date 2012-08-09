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

    getArtistAndTrackNames: function(video) {
        if (video.track && video.artist) {
            return { track: video.track, artist: video.artist };
        }

        var title = video.title.toLowerCase();
        var ret = false;
        var strip = [
            '(official video)',
            'official video',
            'p/v',
            'm/v'
        ];

        $.each(strip, function(i, s) {
            title = title.replace(s, '');
        });

        title.replace('  ', '');
        title.replace('   ', '');

        var split = title.split('-');
        var match1 = title.match(/(.*)'(.*)'/); // Robyn 'Call Your Girlfriend' Official Video
        var match2 = title.match(/(.*)"(.*)"/); // Robyn "Call Your Girlfriend" Official Video

        if (split.length >= 2) {
            ret = {
                artist: $.trim(split[0]),
                track: $.trim(split[1])
            };
        } else if (match1 && match1.length === 3) {
            ret = {
                artist: $.trim(match1[1]),
                track: $.trim(match1[2])
            };
        } else if (match2 && match2.length === 3) {
            ret = {
                artist: $.trim(match2[1]),
                track: $.trim(match2[2])
            };
        } else if (video.artist) {
            ret = {
                artist: video.artist,
                track: $.trim(video.title)
            };
        }

        if (ret.track == video.echonestArtist.toLowerCase()) { // TODO: Should count the number of Echo Nest hits in the artist/track and base the decision on that.
            ret.track = ret.artist;
            ret.artist = video.echonestArtist;
        }

        return ret;
    },

    escape: function(s) {
        s = s.replace('<', '&lt;');
        s = s.replace('>', '&gt;');
        s = s.replace('"', '&quot;');
        return s;
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
    },

    addFollowing: function(user) {
        myFollowings.push(user);
    },

    closeAnyOpenArrowPopup: function(user) {
        $('#arrow-popup-blocker').click();
    },

    removeFollowing: function(userId) {
        var newFollowings = [];

        $.each(myFollowings, function(i, item) {
            if (item.id !== userId) {
                newFollowings.push(item);
            }
        });

        myFollowings = newFollowings;
    },

    isFollowingUser: function(userId) {
        var ret = false;

        $.each(myFollowings, function(i, item) {
            if (item.id === userId) {
                ret = true;
                return false;
            }
        });

        return ret;
    },
    
    openLink: function(url) {
        window.open(url);
    }
    
};
