var currentLanguage;
var phrases = [];

var TYPE_COMMENT = 1;
var TYPE_SUGGESTION = 2;
var TYPE_APPROVED = 3;
var TYPE_ORIGINAL_CHANGED = 3;

function showPopup(id) {
    $('#blocker').show();
    $('#' + id).addClass('open');
}

function sendSuggestion() {
    var translation = $(this).val();
    var original = $(this).parents('tr').find('.original').text();

    var args = {
        original: original,
        translation: translation
    };

    if (translation.length > 0) {
        $.post('/api/translations/' + currentLanguage, args, function() {
            alert('thanks for your suggestion :)');
        });
    }
}

function showComments() {
    var $tr = $(this).parents('tr');
    var $popup = $('#commentsPopup');
    var $submit = $popup.find('input[type=submit]');
    var $textarea = $popup.find('textarea');

    var index = $tr.index();
    var phrase = phrases[index];
    var original = $tr.find('.original').text();
    var commentText = $textarea.val();

    function loadHistory() {
        $popup.find('ul').html('');
        $.each(phrases[index].history.reverse(), function(i, item) {
            var $li = $('<li></li>');
            $('<span class="date"></span>').text(item.date).appendTo($li);
            $('<span class="user"></span>').text(item.user.name).appendTo($li);
            $('<span class="text"></span>').text(item.text).appendTo($li);
            $popup.find('ul').append($li);
        });
    }

    loadHistory();

    $textarea.val('');
    $popup.find('h2').text(original);
    $submit.unbind('click');
    $submit.click(function(data) {
        var args = {
            lang: currentLanguage,
            text: $textarea.val()
        };
        $.post('/translations/' + phrase.id + '/comments', args, function() {
            phrases[index].history.push({
                user: {
                    id: my_user_id,
                    name: my_user_name,
                },
                date: 'Just now...',
                type: TYPE_COMMENT,
                text: args.text,
            });
            $textarea.val('');
            loadHistory();
            $tr.find('.comments').html('').append(createCommentsElement(index));
        });
    });

    showPopup('commentsPopup');
}

function createCommentsElement(phraseIndex) {
    var text;
    var numComments = phrases[phraseIndex].history.length;

    if (numComments === 1) {
        text = '1 comment';
    } else if (numComments > 1) {
        text = numComments + ' comments';
    } else {
        text = 'Comment';
    }

    return $('<span class="clickable"></span>').text(text).click(showComments);
}

function createTableRow(phraseIndex, original, translation) {
    var tr = $('<tr></tr>');

    var td1 = $('<td></td').attr('class', 'original').text(original);
    var td2 = $('<td></td').attr('class', 'translation');
    var td3 = $('<td></td').attr('class', 'comments');
    var td4 = $('<td></td').attr('class', 'approved');

    var input = $('<input type="text" />').val(translation);
    input.blur(sendSuggestion);
    input.appendTo(td2);

    createCommentsElement(phraseIndex).appendTo(td3);

    var checkbox = $('<input type="checkbox" />').val(false);
    checkbox.appendTo(td4);

    var label = $('<label></label>').text('Approved');
    label.appendTo(td4);

    td1.appendTo(tr);
    td2.appendTo(tr);
    td3.appendTo(tr);
    td4.appendTo(tr);

    return tr;
}

function createTableBody(data) {
    var tbody = $('<tbody></tbody>');

    $.each(data, function(i, item) {
        createTableRow(i, item.original, item.translation).appendTo(tbody);
    });

    return tbody;
}

function closePopup() {
    $('#blocker').hide();
    $('.popup.open').removeClass('open');
}

function loadTranslations() {
    currentLanguage = $('#language').val(); // global
    $.getJSON('/api/translations/' + currentLanguage, function(data) {
        phrases = data; // global
        $('tbody').replaceWith(createTableBody(data));
    });
}

$(document).ready(function() {
    $('#language').change(loadTranslations);
    loadTranslations();

    $('.popup .close').click(closePopup);

    $('#addPhraseButton').click(function() {
        showPopup('addPhrasePopup');
        $('#addPhrasePopup input[type=text]').val('');
    });

    $('#addPhrasePopup input[type=submit]').click(function() {
        var original, args;

        original = $.trim($('#addPhrasePopup input[type=text]').val());
        if (original.length === 0) {
            return;
        }

        args = {
            original: original,
        };

        $.post('/translations/template', args, function() {
            loadTranslations();
            closePopup();
        });
    });

    var $blocker = $('#blocker');

    $(window).keyup(function(e) {
        if ($blocker.is(':visible') && e.keyCode == 27) {
            closePopup();
        }
    });
});

$(document).ajaxError(function (e, r, ajaxOptions, thrownError) {
    if (r.status === 500 && $.trim(r.responseText).length > 0) {
        $('body').html(r.responseText);
    }
});

