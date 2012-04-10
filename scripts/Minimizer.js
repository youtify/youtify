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
var IGNORE_PATTERN = /jquery-1\.|jquery\.time|less|soundmanager|shuffle|featuredetection.*.js/;

var files = [];

function startUglification() {
    var i;
    var file;
    for (i = 0; i < files.length; i += 1) {
        file = files[i];
        file.content = jsmin(file.content);
        file.tr.find('td.jsmin').text("✓");
    }
}

function processRow(tr) {
    var filename = tr.find('td.filename').text();
    location.hash = filename;

    $('tr.selected').removeClass('selected');
    tr.addClass('selected');

    if (tr.hasClass('ignore') && !tr.is(':last-child')) {
        processRow(tr.next());
        return;
    }

    function success(data) {
        files.push({
            'name': filename,
            'content': data,
            'tr': tr,
        });
        tr.addClass('success');
        tr.find('td.jslint').text("✓");
        if (tr.is(':last-child')) {
            startUglification();
        } else {
            processRow(tr.next());
        }
    }

    function error(report) {
        tr.addClass('error');
        $('#output h1').text(filename);
        $('#output pre').html(report);
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
            if (JSLINT(data, JSLINT_OPTIONS)) {
                success(data);
            } else {
                error(JSLINT.report());
            }
        }
    });
}

function createTr(filename) {
    var tr = $('<tr></tr>');
    $('<td class="filename"></td>').text(filename).appendTo(tr);
    $('<td class="jslint"></td>').appendTo(tr);
    $('<td class="jsmin"></td>').appendTo(tr);

    if (filename.match(IGNORE_PATTERN)) {
        tr.addClass('ignore');
    }

    return tr;
}

$(function() {
    if (location.hash) {
        var filename = location.hash.substr(1);
        function success(data) {
            location.hash = '';
            location.reload();
        }
        function error(report) {
            $('#output h1').text(filename);
            $('#output pre').html(report);
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

        for (i = 0; i < files.length; i += 1) {
            output += files[i].content;
        }

        $('body').html('');
        $('<textarea cols="80" rows="30"></textarea>').val(output).appendTo('body');
    });
});
