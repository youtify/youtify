var JSLINT_OPTIONS = {
    devel: true,
    browser: true,
    sloppy: true,
    undef: true,
    vars: true,
    white: true,
    nomen: true,
    maxerr: 50,
    indent: 4
}

function processRow(tr) {
    var filename = tr.find('td.filename').text();

    $('tr.selected').removeClass('selected');
    tr.addClass('selected');

    $.ajax({
        url: filename,
        dataType: 'text',
        success: function(data) {
            if (JSLINT(data, JSLINT_OPTIONS)) {
                tr.addClass('success');
                tr.find('td.jslint').text("OK");
                $('#output').text(filename);
                if (!tr.is(':last-child')) {
                    processRow(tr.next());
                }
            } else {
                tr.addClass('error');
                tr.find('td.jslint').text("FAIL");
                $('#output').html(JSLINT.report());
            }

        }
    });
}

$(function() {
    processRow($('#files tbody tr:first'));
});
