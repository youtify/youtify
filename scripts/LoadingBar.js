var LoadingBar = {
    $elem: undefined,

    init: function() {
        LoadingBar.$elem = $('#loading');
    },

    show: function() {
        LoadingBar.$elem.fadeIn(200);
    },

    hide: function() {
        LoadingBar.$elem.fadeOut(200);
    }
};
