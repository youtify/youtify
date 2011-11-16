$(document).ajaxError(function (e, r, ajaxOptions, thrownError) {
    if (r.status === 500 && $.trim(r.responseText).length > 0) {
        $('body').html(r.responseText);
    }
});

function showPopup(id) {
    $('#blocker').show();
    $('#' + id).addClass('open');
}

function closePopup() {
    $('#blocker').hide();
    $('.popup.open').removeClass('open');
}

function loadPhrases() {
    function createTableRow(item) {
        var $tr = $('<tr></tr>');
        $('<td class="original"></td>').text(item.original).appendTo($tr);
        return $tr;
    }

    $('#phrases tbody').html('');
    $.getJSON('/admin/phrases', function(data) {
        $.each(data, function(i, item) {
            createTableRow(item).appendTo('#phrases tbody');
        });
    });
}

function getLanguageByCode(code) {
    var ret = 'Unknown';

    $.each($('select[name=lang] option'), function(i, elem) {
        elem = $(elem);
        if (elem.attr('value') === code) {
            ret = elem.text();
            return false;
        }
    });

    return ret;
}

function loadTeamLeaders() {
    function createRow(item) {
        var $tr = $('<tr></tr>');
        $('<td></td>').text(getLanguageByCode(item.lang)).appendTo($tr);
        $('<td></td>').text(item.user.name).appendTo($tr);
        return $tr;
    }

    $('#leaders tbody').html('');
    $.getJSON('/translations/leaders', function(data) {
        $.each(data, function(i, item) {
            createRow(item).appendTo('#leaders tbody');
        });
    });
}

var tabCallbacks = {
    phrases: function() {
    },
    teams: function() {
    },
    snapshots: function() {
    },
    deploy: function() {
    },
}

$(document).ready(function() {
    $('.popup .close').click(closePopup);

    var $blocker = $('#blocker');

    $(window).keyup(function(e) {
        if ($blocker.is(':visible') && e.keyCode == 27) {
            closePopup();
        }
    });

    $('#tabs li').click(function() {
        var rel = $(this).attr('rel');

        $('#tabs .selected').removeClass('selected');
        $(this).addClass('selected');

        $('.pane.selected').removeClass('selected');
        $('#' + rel).addClass('selected');

        tabCallbacks[rel]();
    });

    $('#tabs li').first().click();

    $('#addPhraseButton').click(function() {
        showPopup('addPhrasePopup');
        $('#addPhrasePopup input[type=text]').val('');
    });

    $('#addLeaderButton').click(function() {
        showPopup('addLeaderPopup');
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

    $('#addLeaderPopup input[type=submit]').click(function() {
        var args = {};

        args.lang = $.trim($('#addLeaderPopup select[name=lang]').val());
        args.user = $.trim($('#addLeaderPopup input[name=user]').val());

        $.post('/translations/leaders', args, function() {
            loadTeamLeaders();
            closePopup();
        });
    });

    loadPhrases();
    loadTeamLeaders();
});
