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
            if (UserManager.currentUser && UserManager.currentUser.flattrUserName && settingsFromServer.flattr_automatically && AutoFlattrer.thingForCurrentTrack) {
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
                videoTitle: thingData.videoTitle,
                thing_id: thingData.thingId
            };
        } else {
            url = '/flattrautosubmit';
            postParams = {
                videoTitle: thingData.videoTitle,
                url: thingData.sourceUrl
            };
        }

        $.post(url, postParams, function(data) {
            if (data === null) {
                console.log("Error: response from Flattr was null");
            } else if (data.hasOwnProperty('error_description')) {
                if (data.hasOwnProperty('error') && data.error == 'flattr_once') {
                    return;
                }
                console.log("Flattr error", data.error_description);
            } else {
                EventSystem.callEventListeners('flattr_click_made', data);
            }
        });
    }
};
