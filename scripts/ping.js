function ping_Init() {
    setInterval(function () {
        $.get('/ping', function (data) {});
    }, 60*1000*10);
}