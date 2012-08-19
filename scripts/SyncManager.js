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

    init: function(deviceToken) {
        this.deviceToken = deviceToken;
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
    }
};
