/**
 * First do regular XML escaping on input text, after parse links into <a> tags.
 *
 * From http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
 */
function linkify(inputText) {
    if (inputText === undefined || inputText === null) {
        return '';
    }
    var replaceText, replacePattern1, replacePattern2, replacePattern3;

    replacedText = inputText;

    replacedText = replacedText.replace(/&/g, '&amp;');
    replacedText = replacedText.replace(/</g, '&lt;');
    replacedText = replacedText.replace(/>/g, '&gt;');

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(http?|https):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = replacedText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    return replacedText;
}

var BottomPanel = {
    init: function() {
        // TITLE
        EventSystem.addEventListener('video_info_fetched', function(info) {
            var  $title = $('#bottom .info .title');
            $title.text(info.title).attr('title', info.title);
            $title.unbind('click');
            $title.click(function() {
                var $popup = $('#video-info-popup');

                $popup.find('.description').html(linkify(info.description));
                $popup.find('.uploader').text(info.author.name);
                $popup.find('.uploader').unbind('click');
                $popup.find('.uploader').click(function() {
                    Uploader.loadVideosFromURI(info.author.uri);
                });

                $title.arrowPopup('#video-info-popup', 'down');
            });
        });

        // CONTROLS
        $('#bottom .controls .playpause').click(player.playPause);
        $('#bottom .controls .next').click(player.next);
        $('#bottom .controls .prev').click(player.prev);
        
        // FULLSCREEN
        $('#bottom .fullscreen').click(function(event) {
            $(this).toggleClass('on');
            player.toggleFullScreen(event);
        });
        
        // SHUFFLE
        $('#bottom .shuffle').click(function() {
            $(this).toggleClass('on');
        });
    }
};
