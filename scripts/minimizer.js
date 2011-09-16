var JSLINT_OPTIONS = {
    devel: true,
    browser: true,
    sloppy: true,
    undef: true,
    unparam: true,
    vars: true,
    white: true,
    nomen: true,
    maxerr: 50,
    indent: 4
}

var MATCH_PATTERN = /\/scripts\/(.*\.js)/g;
var IGNORE_PATTERN = /less|shuffle.*.js/;

function processRow(tr) {
    var filename = tr.find('td.filename').text();

    $('tr.selected').removeClass('selected');
    tr.addClass('selected');

    if (tr.hasClass('ignore') && !tr.is(':last-child')) {
        processRow(tr.next());
        return;
    }

    $.ajax({
        url: filename,
        dataType: 'text',
        success: function(data) {
            if (JSLINT(data, JSLINT_OPTIONS)) {
                tr.addClass('success');
                tr.find('td.jslint').text("✓");
                if (!tr.is(':last-child')) {
                    processRow(tr.next());
                }
            } else {
                tr.addClass('error');
                $('#output').html(JSLINT.report());
            }

        }
    });
}

function createTr(filename) {
    var tr = $('<tr></tr>');
    $('<td class="filename"></td>').text(filename).appendTo(tr);
    $('<td class="jslint"></td>').appendTo(tr);

    if (filename.match(IGNORE_PATTERN)) {
        tr.addClass('ignore');
    }

    return tr;
}

$(function() {
    $.get('/', function(data) {
        var filename;
            match = data.match(MATCH_PATTERN);

        for (var i = 0; i < match.length; i += 1) {
            var filename = match[i];
            $('#files').append(createTr(filename));
        }

        processRow($('#files tbody tr:first'));
    }, 'text');
});
