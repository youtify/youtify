
Logo = {
    init: function() {
        var logo = $('#top .logo');
        logo.click(function(event) {
            $('#left .menu .home').mousedown();
        });
        
        logo.bind('contextmenu', function(event) {
            LoadingBar.show();
            $.get('/logo', function(data) {
                $('#logo-popup > div').html(data);
            });
            logo.arrowPopup('#logo-popup', 'up');
            LoadingBar.hide();
            return false;
        });
    }
};