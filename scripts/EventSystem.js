var EventSystem = {
    init: function() {
    },

    listeners: {
        'playlists_loaded': [],
        'video_started_playing_successfully': [],
        'video_info_fetched': [],
        'artist_twitter_account_found': [],
        'uploader_info_fetched': []
    },

    addEventListener: function(type, fn) {
        EventSystem.listeners[type].push(fn);
    },

    callEventListeners: function(type, payload) {
        var i,
            fn,
            handlers = EventSystem.listeners[type];

        for (i = 0; i < handlers.length; i += 1) {
           fn = handlers[i];
           fn(payload);
        }
    },
};
