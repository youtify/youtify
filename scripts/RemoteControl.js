var RemoteControl = {
    socket: null,
    server: null,

    init: function(server) {
        this.server = server;
        if (this.isReceiver()) {
            this.enableReceiver();
        }
    },

    sendCommand: function(command, data) {
        $.post(this.server, data, function(response) {
            console.log(response);
        });
    },

    enableReceiver: function() {
        localStorage.isRemote = JSON.stringify(false);
        localStorage.isReceiver = JSON.stringify(true);

        this.socket = io.connect(this.server);
        console.log('listening on ' + this.server);

        this.socket.on('commands', function(video) {
            console.log('received video play request', video);
            player.play(new Video(Utils.parseQueryString(video)));
        });
    },

    enableRemote: function() {
        localStorage.isRemote = JSON.stringify(true);
        localStorage.isReceiver = JSON.stringify(false);
    },

    isRemote: function() {
        return JSON.parse(localStorage.isRemote || "false");
    },

    isReceiver: function() {
        return JSON.parse(localStorage.isReceiver || "false");
    }
}
