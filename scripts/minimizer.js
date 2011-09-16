var JSLINT_OPTIONS = {
    devel: true,
    browser: true,
    regexp: true,
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

var fileContents = [];

function processRow(tr) {
    var filename = tr.find('td.filename').text();
    location.hash = filename;

    $('tr.selected').removeClass('selected');
    tr.addClass('selected');

    if (tr.hasClass('ignore') && !tr.is(':last-child')) {
        processRow(tr.next());
        return;
    }

    function success() {
        tr.addClass('success');
        tr.find('td.jslint').text("✓");
        if (!tr.is(':last-child')) {
            processRow(tr.next());
        }
    }

    function error() {
        tr.addClass('error');
        $('#output h1').text(filename);
        $('#output pre').html(JSLINT.report());
        $('#files').hide();
        $('#output').show();
    }

    loadFile(filename, success, error);
}

function loadFile(filename, success, error) {
    $.ajax({
        url: filename,
        dataType: 'text',
        success: function(data) {
            if (data) {
                fileContents.push(data);
            }
            if (JSLINT(data, JSLINT_OPTIONS)) {
                success();
            } else {
                error();
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
    if (location.hash) {
        var filename = location.hash.substr(1);
        function success() {
            location.hash = '';
            location.reload();
        }
        function error() {
            $('#output h1').text(filename);
            $('#output pre').html(JSLINT.report());
            $('#files').hide();
            $('#output').show();
        }
        loadFile(filename, success, error);
    } else {
        $.get('/', function(data) {
            var filename;
                match = data.match(MATCH_PATTERN);

            for (var i = 0; i < match.length; i += 1) {
                var filename = match[i];
                $('#files').append(createTr(filename));
            }

            processRow($('#files tbody tr:first'));
        }, 'text');
    }
    $("#generate").click(function() {
        var i,
            output = '';

        for (i = 0; i < fileContents.length; i += 1) {
            output += fileContents[i];
        }

        $('body').html('');
        $('<textarea cols="80" rows="30"></textarea>').val(output).appendTo('body');
    });
});
