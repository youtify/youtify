var Ping = {
    init: function() {
        setInterval(function () {
            if (UserManager.isLoggedIn()) {
                $.post('/ping', function (data) {
                    if (data === 'logged_out') {
                        UserManager.logOutCurrentUser();
                    }
                });
            } else {
                $.get('/ping', function (data) {});
            }
        }, 60*1000*10);
    }
};
