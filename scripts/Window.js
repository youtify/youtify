var Window = {
    init: function() {
        EventSystem.addEventListener('video_info_fetched', function(info) {
            document.title = "Youtify - " + info.title;
        });
    }
};
