var FlattrFinder = {
    init: function() {
        EventSystem.addEventListener('video_info_fetched', FlattrFinder.findFlattrThingForTrack);
        EventSystem.addEventListener('uploader_info_fetched', FlattrFinder.findFlattrThingForUploader);
        EventSystem.addEventListener('artist_twitter_account_found', FlattrFinder.findFlattrThingForTwitterAccount);
    },

    findFlattrThingForTwitterAccount: function(twitterUrl) {
        var screenName = twitterUrl.split('/')[3];
        var url = 'https://api.twitter.com/1/users/show.json?screen_name=' + screenName +'&include_entities=true&callback=?';

        console.log('looking up flattr thing for ' + twitterUrl);

        $.getJSON(url, function(twitterData) {
            var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(twitterUrl) + '&jsonp=?';
            $.getJSON(url, function(flattrData) {
                EventSystem.callEventListeners('flattr_thing_for_twitter_account_found', {
                    sourceUrl: twitterUrl,
                    thingId: flattrData.id || null,
                    flattrs: flattrData.flattrs || 0
                });
            });
        });
    },

    findFlattrThingForTrack: function(info) {
        var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(info.url) + '&jsonp=?';

        console.log('looking up flattr thing for ' + info.url);

        if (info.video.flattrThingId) {
            EventSystem.callEventListeners('flattr_thing_for_track_found', {
                sourceUrl: info.url,
                thingId: info.video.flattrThingId,
                flattrs: info.video.flattrs || 0
            });
        } else {
            $.getJSON(url, function(data) {
                if (data.message !== 'not_found') {
                    EventSystem.callEventListeners('flattr_thing_for_track_found', {
                        sourceUrl: info.url,
                        thingId: data.id || null,
                        flattrs: data.flattrs || 0
                    });
                }
            });
        }
    },

    findFlattrThingForUploader: function(info) {
        var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(info.url) + '&jsonp=?';

        console.log('looking up flattr thing for ' + info.url);

        $.getJSON(url, function(data) {
            if (data.message !== 'not_found') {
                EventSystem.callEventListeners('flattr_thing_for_uploader_found', {
                    sourceUrl: info.url,
                    thingId: data.id || null,
                    flattrs: data.flattrs || 0
                });
            }
        });
    }
};
