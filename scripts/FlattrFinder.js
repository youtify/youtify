var FlattrFinder = {
    init: function() {
        EventSystem.addEventListener('video_info_fetched', FlattrFinder.findFlattrThingForTrack);
    },

    findFlattrThingForTrack: function(info) {
        var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(info.url) + '&jsonp=?';

        console.log('looking up flattr thing for ' + info.url);

        if (info.video.flattrThingId) {
            EventSystem.callEventListeners('flattr_thing_for_track_found', {
                videoTitle: info.video.title,
                sourceUrl: info.url,
                thingId: info.video.flattrThingId,
                flattrs: info.video.flattrs || 0
            });
        } else {
            $.getJSON(url, function(data) {
                if (data.message !== 'not_found') {
                    EventSystem.callEventListeners('flattr_thing_for_track_found', {
                        videoTitle: info.video.title,
                        sourceUrl: info.url,
                        thingId: data.id || null,
                        flattrs: data.flattrs || 0
                    });
                }
            });
        }
    }
};
