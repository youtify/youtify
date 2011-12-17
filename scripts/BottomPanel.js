var BottomPanel = {
    init: function() {
        EventSystem.addEventListener('video_info_fetched', function(info) {
            $('#bottom .info .title').text(info.title);
        });
    }
};
