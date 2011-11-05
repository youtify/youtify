function createTableRow(key, translation) {
    var tr = $('<tr></tr>');

    var td1 = $('<td></td').attr('class', 'original').text(key);
    var td2 = $('<td></td').attr('class', 'translation');
    var td3 = $('<td></td').attr('class', 'comments');
    var td4 = $('<td></td').attr('class', 'approved');

    var input = $('<input type="text" />').val(translation);
    input.appendTo(td2);

    var comment = $('<a href="#"></a>').text('Comment');
    comment.appendTo(td3);

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

    $.each(data, function(key, i) {
        var translation = data[key];
        createTableRow(key, translation).appendTo(tbody);
    });

    return tbody;
}

function closePopup() {
    $('#blocker').hide();
    $('.popup.open').removeClass('open');
}

function loadTranslations() {
    var code = $('#language').val();
    $.getJSON('/api/translations/' + code, function(data) {
        $('tbody').replaceWith(createTableBody(data));
    });
}

$(document).ready(function() {
    $('#language').change(loadTranslations);
    loadTranslations();

    $('.popup .close').click(closePopup);

    $('#addPhraseButton').click(function() {
        $('#blocker').show();
        $('#addPhrasePopup input[type=text]').val('');
        $('#addPhrasePopup').addClass('open');
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

