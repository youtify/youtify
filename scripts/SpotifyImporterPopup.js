var SpotifyImporterPopup = {
    init: function() {
        $('#spotify-importer')
            .bind('contextmenu', function(event) {
                event.stopPropagation();
            })
            .click(function(event) {
                event.stopPropagation();
            });

        var importer = new SpotifyImporter();

        // cancel
        $('#spotify-importer .cancel').click(function() {
            importer.cancel();
            $('#spotify-importer').hide();
            $('#blocker, .arrow').remove();
        });

        // start
        $('#spotify-importer .start').click(function() {
            var li = $('#left .playlists ul .selected');
            var playlist = li.data('model');
            importer.start(
                $('#spotify-importer textarea').val(),
                playlist,
                function() {
                    // callbackUpdate
                    $('#spotify-importer .added').text(importer.added);
                    $('#spotify-importer .max').text('/'+importer.max);
                    loadPlaylistView(playlist);
                },
                function() {
                    // callbackDone
                    importer.cancel();
                    $('#spotify-importer').hide();
                    $('#blocker, .arrow').remove();
                }
            );
        });
    }
};
