var EventSystem = {
    init: function() {
    },

    listeners: {
        'external_user_subscriptions_loaded': [],
        'new_search_executed': [],
        'language_changed': [],
        'song_almost_done_playing': [],
        'playlists_loaded': [],
        'player_manager_initialized': [],
        'video_started_playing_successfully': [],
        'video_failed_to_play': [],
        'video_played_to_end': [],
        'backend_paused_video': [],
        'backend_played_video': [],
        'video_info_fetched': [],
        'artist_twitter_account_found': [],
        'uploader_info_fetched': [],
        'user_profile_updated': [],
        'video_duration_updated': [],
        'window_resized': []
    },

    addEventListener: function(type, fn) {
        if (EventSystem.listeners.hasOwnProperty(type)) {
            EventSystem.listeners[type].push(fn);
        } else {
            throw 'Unknown event type "' + type + '"';
        }
    },

    callEventListeners: function(type, payload) {
        var i,
            fn,
            handlers = EventSystem.listeners[type];

        for (i = 0; i < handlers.length; i += 1) {
            fn = handlers[i];
            fn(payload);
        }
    }
};
