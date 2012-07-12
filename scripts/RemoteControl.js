var RemoteControl = {
    socket: null,
    server: null,

    init: function(server) {
        this.server = server;
        if (this.isReceiver()) {
            this.enableReceiver();
        }
    },

    play: function(video) {
        var params = {
            command: 'play',
            data: JSON.stringify(video.toJSON())
        };
        $.post(this.server, params, function(response) {
            console.log(response);
        });
    },

    enableReceiver: function() {
        localStorage.isRemote = JSON.stringify(false);
        localStorage.isReceiver = JSON.stringify(true);

        this.socket = io.connect(this.server);
        console.log('listening on ' + this.server);

        this.socket.on('commands', function(params) {
            params = Utils.parseQueryString(params);
            console.log('received command', params);
            switch (params.command) {
                case 'play':
                player.play(new Video(JSON.parse(decodeURIComponent(params.data))));
                break;

                default:
                throw 'Unknown remote control command: ' + params.command;
            }
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
