var SOUNDCLOUD_API_KEY = '206f38d9623048d6de0ef3a89fea1c4d';
var $pages = document.querySelector('.pages');
var $playlistBackButton = document.querySelector('.page.playlist .button.back');
var $trackPageBackButton = document.querySelector('.page.track .button.back');
var pageWidth = 320;

function playlistClickCallback(event) {
    buildPlaylistPage(this.model);
    swipeToPage(1);
    event.preventDefault();
}

function trackClickedCallback(event) {
    buildTrackPage(this.model);
    swipeToPage(2);
    event.preventDefault();
}

function swipeToPage(number) {
    $pages.style.webkitTransform = 'translateX(-' + (number * pageWidth) + 'px)';
    $pages.style.mozTransform = 'translateX(-' + (number * pageWidth) + 'px)';
    $pages.style.transform = 'translateX(-' + (number * pageWidth) + 'px)';
}

function buildPlaylistPage(playlist) {
    var $h1 = document.querySelector('.page.playlist .header h1');
    var $content = document.querySelector('.page.playlist .content');
    $h1.innerHTML = playlist.title;
    $content.innerHTML = '';
    $content.appendChild(createPlaylistUl(playlist));
}

function createPlaylistUl(playlist) {
    var i;
    var track;
    var $ul = document.createElement('ul');
    var $li;
    var tracks = JSON.parse(playlist.videos);

    $ul.setAttribute('class', 'listview');

    for (i = 0; i < tracks.length; i += 1) {
        track = tracks[i];

        $li = document.createElement('li');
        $li.innerHTML = track.title;
        $li.addEventListener('click', trackClickedCallback);
        $li.model = track;

        $ul.appendChild($li);
    }

    return $ul;
}

function buildTrackPage(track) {
    var $h1 = document.querySelector('.page.track .header h1');
    var $content = document.querySelector('.page.track .content');
    $h1.innerHTML = track.title;
    $content.innerHTML = '';

    switch (track.type) {
        case 'soundcloud':
        soundManager.stopAll();
        playSoundCloudTrack(track.videoId);
        loadSoundCloudTrackInfo(track.videoId, $content);
        break;

        case 'officialfm':
        alert('Official.fm tracks can not be played yet');
        break;

        case 'youtube':
        alert('YouTube tracks can not be played yet');
        break;
    }
}

function loadSoundCloudTrackInfo(trackId, $content) {
    var xhr = new XMLHttpRequest();
    var url = 'http://api.soundcloud.com/tracks/' + trackId + '.json?client_id=' + SOUNDCLOUD_API_KEY;
    xhr.open('GET', url);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var json = JSON.parse(xhr.responseText);
            var $img = document.createElement('img');
            console.log(json);
            $img.setAttribute('src', json.artwork_url || json.waveform_url);
            $img.setAttribute('width', '300');
            $content.appendChild($img);
        }
    };
    xhr.send();
}

function playSoundCloudTrack(trackId) {
    soundManager.createSound({
        id: trackId,
        volume: 100,
        url: 'https://api.soundcloud.com/tracks/' + trackId + '/stream?consumer_key=' + SOUNDCLOUD_API_KEY,
        onplay: function() {
        },
        onfinish: function() {
            soundManager.destroySound('soundcloud');
        },
    });
    soundManager.play(trackId);
}

function createPlaylistsUl(playlists) {
    var i;
    var playlist;
    var $ul = document.createElement('ul');
    var $li;
    var $a;

    $ul.setAttribute('class', 'listview');

    for (i = 0; i < playlists.length; i += 1) {
        playlist = playlists[i];

        $li = document.createElement('li');
        $li.innerHTML = playlist.title;
        $li.addEventListener('click', playlistClickCallback);
        $li.model = playlist;

        $ul.appendChild($li);
    }

    return $ul;
}

function main() {
    var $playlistsContent = document.querySelector('.page.playlists .content');
    $playlistsContent.appendChild(createPlaylistsUl(playlistsFromServer));
    $playlistBackButton.addEventListener('click', function() {
        swipeToPage(0);
    });
    $trackPageBackButton.addEventListener('click', function() {
        swipeToPage(1);
    });
}

main();
