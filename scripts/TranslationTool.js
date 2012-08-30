var currentLanguage;
var phrases = [];

function replaceTranslationColumnWithLabel($tr) {
    $td = $tr.find('td.translation');
    var translation = $td.find('input[type=text]').val();
    $td.html('');
    $('<p></p>').text(translation).appendTo($td);
}

function sendSuggestion() {
    var $tr = $(this).parents('tr');
    var id = $tr.data('id')
    var translation = $tr.find('input[type=text]').val();

    var args = {
        text: translation
    };

    if (translation.length > 0) {
        showLoadingBar();
        $.post('/languages/' + currentLanguage + '/translations/' + id, args, function() {
            hideLoadingBar();
            if (!(is_admin || isUserLeaderOfCurrentLang())) {
                replaceTranslationColumnWithLabel($tr);
            }
        });
    }
}

function isUserLeaderOfCurrentLang() {
    return my_langs.indexOf(currentLanguage) !== -1;
}

function createTableRow(item) {
    var tr = $('<tr></tr>').data('id', item.id);

    var td1 = $('<td></td').attr('class', 'original').text(item.original);
    var td2 = $('<td></td').attr('class', 'translation');

    if (is_admin || isUserLeaderOfCurrentLang()) {
        $('<input type="text" />').val(item.translation).appendTo(td2);
        $('<input type="submit" />').val("Send suggestion").click(sendSuggestion).appendTo(td2);
    } else {
        $('<p></p>').text(item.translation).appendTo(td2);
    }

    td1.appendTo(tr);
    td2.appendTo(tr);

    return tr;
}

function updateMailLink() {
    var subject = 'I want to be a translator for ' + currentLanguage;
    var body = "My user id: " + my_user_id + " My user email: " + my_user_email;
    $('#applyLink').attr('href', 'mailto:youtify@youtify.com?subject=' + subject + '&body=' + body);
}

function loadLanguage() {
    currentLanguage = $('#language').val(); // global
    updateMailLink(currentLanguage);
    $('#applyLink').show();

    function loadLeaders() {
        $("#leaders").html('');
        $.getJSON('/languages/' + currentLanguage + '/leaders', function(data) {
            var names = [];
            $.each(data, function(i, item) {
                names.push(item.name);
                if (item.name === my_user_email) {
                    $('#applyLink').hide();
                }
            });
            $('#leaders').text(names.join(', '));
        });
    }

    function loadTranslations() {
        showLoadingBar();
        $.getJSON('/languages/' + currentLanguage + '/translations', function(data) {
            hideLoadingBar();
            var $tbody = $('<tbody></tbody>');
            phrases = data; // global

            $.each(data, function(i, item) {
                createTableRow(item).appendTo($tbody);
            });

            $('tbody').replaceWith($tbody);
        });
    }

    loadLeaders();
    loadTranslations();

    history.pushState(null, null, '/translations/' + currentLanguage);
}

$(document).ready(function() {
    $('#language').change(loadLanguage);

    var path = window.location.pathname.split('/');
    if (path.length === 3) { // e.g. /translations/sv_SE
        $.each($('#language option'), function(i, elem) {
            if ($(elem).attr('value') === path[2]) {
                $(elem).attr('selected', 'selected');
                $('#language').change();
                return false;
            }
        });
    } else {
        $('#language').change();
    }
});
