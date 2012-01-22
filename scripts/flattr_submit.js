var videos = [];


function activateStep1() {
    $('.step.youtify').addClass('active');
    $('.step.flattr').addClass('disabled');
    $('.step.youtube').addClass('disabled');
    $('.step.submit').addClass('disabled');
}

function activateStep2() {
    $('.step.youtify').addClass('ok');
    $('.step.flattr').addClass('active');
    $('.step.youtube').addClass('disabled');
    $('.step.submit').addClass('disabled');
}

function activateStep3() {
    $('.step.youtify').addClass('ok');
    $('.step.flattr').addClass('ok');
    $('.step.youtube').addClass('active');
    $('.step.submit').addClass('disabled');
}

function activateStep4() {
    $('.step.youtify').addClass('ok');
    $('.step.flattr').addClass('ok');
    $('.step.youtube').addClass('ok');
    $('.step.submit').addClass('active');

    $('.step.submit input, .step.submit button').attr('disabled', 'disabled');

    loadVideos(localStorage.youtube_nickname)
    $('.step.youtube .only-ok .nickname').text(localStorage.youtube_nickname);
    $('.step.youtube .only-ok .nickname').attr('href', 'http://www.youtube.com/user/' + localStorage.youtube_nickname);
}

function selectActiveStep() {
    if (my_user_email.length && my_flattr_username && localStorage.youtube_nickname) {
        activateStep4();
    } else if (my_user_email && my_flattr_username) {
        activateStep3();
    } else if (my_user_email) {
        activateStep2();
    } else {
        activateStep1();
    }
}

function createVideoElem(title, videoId, thumbnail) {
    var $li = $('<li class="video"></li>');
    var $a = $('<a target="_blank"></a>').attr('href', 'http://www.youtube.com/watch?v=' + videoId).attr('title', title);
    $('<img />').attr('src', thumbnail.url).appendTo($a)
    $a.appendTo($li);
    return $li;
}

function loadVideos(nickname) {
    var $ul = $('.videos');
    var url = 'http://gdata.youtube.com/feeds/api/users/' + nickname + '/uploads?alt=json-in-script&v=2&callback=?';
    $ul.html('');

    $.getJSON(url, function(data) {
        $.each(data.feed.entry, function(i, item) {
            var url = item.id.$t;
            var videoId = url.match('video:(.*)$')[1];
            var title = item.title.$t;
            var thumbnail = item.media$group.media$thumbnail[0];
            var elem = createVideoElem(title, videoId, thumbnail).data('index', i);

            videos.push({
                title: title,
                videoId: videoId,
                elem: elem
            });

            elem.appendTo($ul);
        });
        checkFlattrStatus();
    });
}

function checkFlattrStatus() {
    $.ajaxSetup({
        async: false
    });

    $.each(videos, function(i, item) {
        $('.submit .status').hide();
        var thingUrl = 'http://www.youtube.com/watch?v=' + item.videoId;
        var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + encodeURIComponent(thingUrl) + '&jsonp=?';
        $.getJSON(url, function(data) {
            if (data.message !== 'not_found') {
                $('<a target="_blank">Already submitted</a>').attr('href', data.link).appendTo(item.elem);
                item.alreadySubmitted = true;
            } else {
                $('<input type="checkbox" checked="checked" />').appendTo(item.elem);
            }
        });
    });

    $.ajaxSetup({
        async: true
    });

    $('.step.submit input, .step.submit button').removeAttr('disabled');
}

function startSubmitProcess() {
    $('.submit input, .submit button').attr('disabled', 'disabled');

    function submitVideo(i) {
        if (i < videos.length) {
            var item = videos[i];
            if (item.elem.find('input').is(':checked')) {
                console.log('submitting', item.title);
                item.elem.addClass('loading');
                $.post('/flattr_submit', function(data) {
                    item.elem.removeClass('loading');
                    item.elem.addClass(data.css_class);
                    submitVideo(i+1);
                });
            } else {
                submitVideo(i+1);
            }
        } else {
            alert('Videos submitted successfully!');
        }
    }

    submitVideo(0);
}

$(document).ready(function() {
    selectActiveStep();

    $('button.save-youtube-nickname').click(function() {
        var nickname = $.trim($('.step.youtube input.nickname').val());
        if (nickname.length) {
            localStorage.youtube_nickname = nickname;
            location.reload();
        } else {
            alert("Enter a valid YouTube nickname");
        }
    });
    
    $('.youtube .action.change').click(function() {
        localStorage.removeItem('youtube_nickname');
        location.reload();
    });

    $('button.go').click(function() {
        startSubmitProcess();
    });
});
