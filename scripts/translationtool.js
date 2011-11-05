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

$(document).ready(function() {
    $('#language').change(function() {
        var code = $(this).val();
        $.getJSON('/api/translations/' + code, function(data) {
            $('tbody').replaceWith(createTableBody(data));
        });
    }).change();
});
