var testPlaylistManager,
    tmp;

tests.push(function() {
    var playlist = testPlaylistManager.getPlaylist(0);
    playlist.rename('britney n spice');

    // Also test that saving works...
    testPlaylistManager.save();
    testPlaylistManager = new PlaylistsManager()

    playlist = testPlaylistManager.getPlaylist(0);
    assertEquals(playlist.title, 'britney n spice');
});

tests.push(function() {
    assertEquals(testPlaylistManager.playlists.length, 2);
    testPlaylistManager.deletePlaylist(0);
    assertEquals(testPlaylistManager.playlists.length, 1);
});

tests.push(function() {
    var playlist = testPlaylistManager.getPlaylist(0);
    playlist.deleteVideo(1);

    assertEquals(playlist.videos.length, 3);
    assertEquals(playlist.videos[0].title, 'vid1');
    assertEquals(playlist.videos[1].title, 'vid3');
    assertEquals(playlist.videos[2].title, 'vid4');
});

tests.push(function() {
    var playlist = testPlaylistManager.getPlaylist(0);
    playlist.moveVideo(3, 1);

    assertEquals(playlist.videos[0].title, 'vid1');
    assertEquals(playlist.videos[1].title, 'vid4');
    assertEquals(playlist.videos[2].title, 'vid2');
    assertEquals(playlist.videos[3].title, 'vid3');
});

tests.push(function() {
    testPlaylistManager.movePlaylist(1, 0); // move index 1 to index 0
    assertEquals(testPlaylistManager.playlists[0].title, 'playlist2');
    assertEquals(testPlaylistManager.playlists[1].title, 'playlist1');
});

tests.push(function() {
    testPlaylistManager.movePlaylist(1, 1); // move index 1 to index 1
    assertEquals(testPlaylistManager.playlists[0].title, 'playlist1');
    assertEquals(testPlaylistManager.playlists[1].title, 'playlist2');
});

tests.push(function() {
    assertEquals(extractArtist('Britney Spears - Toxic'), 'Britney Spears');
    assertEquals(extractArtist('Britney Spears Toxic'), false);
});

function setup() {
    localStorage['playlists'] = JSON.stringify([
        {
            title: 'playlist1',
            videos: [
                {
                    title: 'vid1',
                    videoid: '123',
                },
                {
                    title: 'vid2',
                    videoid: '456',
                },
                {
                    title: 'vid3',
                    videoid: '789',
                },
                {
                    title: 'vid4',
                    videoid: '101112',
                }
            ]
        },
        {
            title: 'playlist2',
            videos: []
        }
    ]);
    testPlaylistManager = new PlaylistsManager();
}

function start() {
    tmp = localStorage['playlists'];
}

function complete() {
    localStorage['playlists'] = tmp;
}

runTests();

