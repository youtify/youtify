var AutoFlattrer = {
    thingForCurrentTrack: null,

    init: function() {
        EventSystem.addEventListener('video_started_playing_successfully', function(data) {
            AutoFlattrer.thingForCurrentTrack = false;
        });

        EventSystem.addEventListener('flattr_thing_for_track_found', function(data) {
            AutoFlattrer.thingForCurrentTrack = data;
        });

        EventSystem.addEventListener('song_almost_done_playing', function(data) {
            if (has_flattr_access_token && settingsFromServer.flattr_automatically && AutoFlattrer.thingForCurrentTrack) {
                AutoFlattrer.makeFlattrClick(AutoFlattrer.thingForCurrentTrack);
            }
        });
    },

    makeFlattrClick: function(thingData) {
        var url;
        var postParams;

        if (thingData.thingId) {
            url = '/flattrclick';
            postParams = {
                thing_id: thingData.thingId
            };
        } else {
            url = '/flattrautosubmit';
            postParams = {
                url: thingData.sourceUrl
            };
        }

        $.post(url, postParams, function(data) {
            if (data === null) {
                console.log("Error: response from Flattr was null");
            } else if (data.hasOwnProperty('error_description')) {
                console.log("Flattr error", data.error_description);
            } else {
                EventSystem.callEventListeners('flattr_click_made', data);
            }
        });
    }
};
