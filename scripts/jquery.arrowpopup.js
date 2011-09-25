(function($){

    $.fn.arrowPopup = function(popupSelector, arrowDirection) {
        var popup = $(popupSelector);
        var offset = $(this).offset();
        arrowDirection = arrowDirection || 'up';

        var left = 0;
        var top = 0;

        popup.removeClass('point-up').removeClass('point-left');

        switch (arrowDirection) {
            case 'up':
            popup.addClass('point-up');
            left = offset.left + ($(this).width()/2) - (popup.width()/2);
            top = offset.top + $(this).height() + 15; 
            break;

            case 'left':
            popup.addClass('point-left');
            left = 230;
            top = offset.top + ($(this).height()/2) - (popup.height()/2);
            break;
        }

        // Make sure the popup doesn't overflow if the window is too narrow
        var popupRightSide = left + popup.width();
        var windowRightSide = $(window).width() - 25; // assuming scrollbar takes up 25px;

        if (popupRightSide > windowRightSide) {
            left -= (popupRightSide - windowRightSide);
        }

        if (left < 0) {
            left = 0;
        }

        // Display a blocker div that removes the popup when clicked
        $('<div id="arrow-popup-blocker"></div>').mousedown(function(event) {
            $(this).remove();
            popup.hide();
            event.stopPropagation();
        }).appendTo('body');

        popup.css({
            top: top,
            left: left
        }).show();

        return this;
    };

}(jQuery));
