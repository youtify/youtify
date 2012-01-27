$(document).ajaxError(function (e, r, ajaxOptions, thrownError) {
    if (r.status === 500 && $.trim(r.responseText).length > 0) {
        $('body').html(r.responseText);
    }
});

function showLoadingBar() {
    $('#loading').show();
}

function hideLoadingBar() {
    $('#loading').hide();
}

function showPopup(id) {
    $('#blocker').show();
    $('#' + id).addClass('open').css('top', $(window).scrollTop() + 100);
}

function closePopup() {
    $('#blocker').hide();
    $('.popup.open').removeClass('open');
}

$(function() {
    $('.popup .close').click(closePopup);

    var $blocker = $('#blocker');

    $(window).keyup(function(e) {
        if ($blocker.is(':visible') && e.keyCode == 27) {
            closePopup();
        }
    });
});
