function showPopup(id) {
    $('#blocker').show();
    $('#' + id).addClass('open');
}

function closePopup() {
    $('#blocker').hide();
    $('.popup.open').removeClass('open');
}

function createTableRow(item) {
    var $tr = $('<tr></tr>');
    $('<td class="original"></td>').text(item.original).appendTo($tr);
    return $tr;
}

function loadPhrases() {
    $('tbody').html('');
    $.getJSON('/admin/phrases', function(data) {
        $.each(data, function(i, item) {
            createTableRow(item).appendTo('tbody');
        });
    });
}

$(document).ready(function() {
    $('.popup .close').click(closePopup);

    var $blocker = $('#blocker');

    $(window).keyup(function(e) {
        if ($blocker.is(':visible') && e.keyCode == 27) {
            closePopup();
        }
    });

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
            loadPhrases();
            closePopup();
        });
    });

    loadPhrases();
});
