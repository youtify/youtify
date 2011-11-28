
var LoadMore = {
    createView: function(callback) {
        var $tr = $('<tr/>')
            .addClass('loadMore')
            .append($('<td/>'))
            .append($('<td class="space"/>'));
        $('<td/>').text('Load more').click(function(event) {
            $(this).addClass('loading');
            callback();
        }).appendTo($tr);
        $tr.append($('<td class="space"/>'))
            .append($('<td/>'))
            .append($('<td class="space"/>'))
            .append($('<td/>'));
        return $tr;
    }
};