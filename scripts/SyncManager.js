/**
 * When a playlist is updated from one client, the server stores a
 * "device token" on the user. If a client attempts to update a playlist but
 * does not send with it a token matching the one stored on the user, an HTTP
 * 409 error is returned.
 *
 * In such a case, the SyncManager retrieves a new token and reloads the
 * playlists, making sure the user has the latest version of the playlists,
 * and then retries to make the changes.
 */
var SyncManager = {
    lastAction: null,
    deviceToken: null,

    init: function(deviceToken, lastNotificationSeenTimestamp) {
        this.deviceToken = deviceToken;
        this.lastNotificationSeenTimestamp = lastNotificationSeenTimestamp;
        setInterval(this.checkForNewNotifications, 60 * 10 * 1000);
    },

    checkForNewNotifications: function() {
        var self = this;
        Activities.getNewNotifications(function(data) {
            if (data.length > 0 && data[0].timestamp > self.lastNotificationSeenTimestamp) {
                $('#top .activities').addClass('has-new');
            }
            console.log(data);
        });
    },

    getDeviceToken: function() {
        return this.deviceToken;
    },

    setLastAction: function(lastAction) {
        this.lastAction = lastAction;
    },

    reloadAndPerformLastAction: function(callback) {
        var self = this;
        LoadingBar.show(TranslationSystem.get('Syncing...'));
        $.getJSON('/me/request_new_device_token', function(data) {
            LoadingBar.hide();
            self.deviceToken = data.device;
            playlistManager.reset();
            playlistManager.load(function() {
                if (self.lastAction !== null) {
                    self.lastAction();
                    self.lastAction = null;
                }
            });
        });
    },

    setLastNotificationSeenTimestamp: function(lastNotificationSeenTimestamp) {
        this.lastNotificationSeenTimestamp = lastNotificationSeenTimestamp;
        $.post('/me/last-notification-seen-timestamp', {val:lastNotificationSeenTimestamp});
    },

    getLastNotificationSeenTimestamp: function() {
        return this.lastNotificationSeenTimestamp;
    }
};
