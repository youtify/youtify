var playlistMap = {};

function createPlaylistPage(playlist) {
    var $page = $('<div data-role="page"></div>');
    var i;
    var video;
    var $ul = $('<ul data-role="listview" data-inset="true" class="videos"></ul>');

    for (i = 0; i < playlist.videos; i += 1) {
        video = playlist.videos[i];
        $li = $('<li><a href="#">' + video.title + '</a></li>');
        $ul.append($li);
    }

    $page.append($ul);
    $ul.listview();

    return $page;
}

function createPlaylistsUl(playlists) {
    var i;
    var $ul = $('<ul data-role="listview" data-inset="true"></ul>');
    var $li;
    var playlist;

    for (i = 0; i < playlists.length; i += 1) {
        playlist = playlists[i];
        playlistMap[playlist.remoteId] = playlist;

        $li = $('<li><a href="/users/' + USER.id + '/playlists/' + playlist.remoteId + '">' + playlist.title + '</a></li>');
        $ul.append($li);
    }

    return $ul;
}

$(function() {
    var $content = $('.playlists .content');
    var $ul = createPlaylistsUl(playlistsFromServer);
    $content.append($ul);
    $ul.listview();
});

function showPlaylistPage() {
    var $page = $('.playlist'),
        $header = $page.children( ":jqmData(role=header)" ),
        $content = $page.children( ":jqmData(role=content)" ),
        playlist = playlistsFromServer[0];

    alert('show playlist');
}

$(document).bind("pagebeforechange", function(e, data) {
    console.log(data, e, location.href, $.mobile.path.parseUrl(data.toPage));
    if (location.href.match('/users/.*/playlists/.*')) {
        showPlaylistPage();
    }
});
