var Ping = {
    init: function() {
        setInterval(function () {
            $.get('/ping', function (data) {});
        }, 60*1000*10);
    }
};
