var RemoteControl = {
    socket: null,
    server: null,
    setVolumeTimer: null,

    init: function(server) {
        this.server = server;
        if (this.isReceiver()) {
            this.enableReceiver();
        } else if (this.isRemote()) {
            this.enableRemote();
        }
    },

    sendCommand: function(command, data) {
        console.log('sending command', command, data);
        var params = {
            command: command,
            data: data
        };
        $.post(this.server, params, function(response) {
            console.log(response);
        });
    },

    play: function(video) {
        this.sendCommand('play', JSON.stringify(video.toJSON()));
    },

    setVolume: function(volume) {
        var self = this;
        clearTimeout(self.setVolumeTimer)
        self.setVolumeTimer = setTimeout(function() {
            self.sendCommand('setVolume', volume);
        }, 250);
    },

    enableReceiver: function() {
        localStorage.isRemote = JSON.stringify(false);
        localStorage.isReceiver = JSON.stringify(true);

        this.socket = io.connect(this.server);
        console.log('listening on ' + this.server);

        this.socket.on('commands', function(params) {
            params = Utils.parseQueryString(params);
            console.log('received command', params.command, params.data);
            switch (params.command) {
                case 'play':
                player.play(new Video(JSON.parse(decodeURIComponent(params.data))));
                break;

                case 'setVolume':
                player.setVolume(Number(params.data));
                break;

                default:
                throw 'Unknown remote control command: ' + params.command;
            }
        });
        $('#left .players').show();
    },

    enableRemote: function() {
        localStorage.isRemote = JSON.stringify(true);
        localStorage.isReceiver = JSON.stringify(false);
        $('#left .players').hide();
    },

    isRemote: function() {
        return JSON.parse(localStorage.isRemote || "false");
    },

    isReceiver: function() {
        return JSON.parse(localStorage.isReceiver || "false");
    }
}
