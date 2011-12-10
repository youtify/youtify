var EventSystem = {
    init: function() {
    },

    events: {
        'video_started_playing_successfully': [],
        'video_info_fetched': [],
        'artist_twitter_account_found': [],
        'uploader_info_fetched': []
    },

    attachEventHandler: function(type, fn) {
        EventSystem.events[type].push(fn);
    },

    callEventHandlers: function(type, payload) {
        var i,
            fn,
            handlers = EventSystem.events[type];

        for (i = 0; i < handlers.length; i += 1) {
           fn = handlers[i];
           fn(payload);
        }
    },
};
