(function($){

    $.fn.arrowPopup = function(popupSelector, arrowDirection) {
        var popup = $(popupSelector);
        var offset = $(this).offset();
        arrowDirection = arrowDirection || 'up';

        // Make sure the popup doesn't overflow if the window is too narrow
        var left = 0;
        var top = 0;

        switch (arrowDirection) {
            case 'up':
            left = offset.left + ($(this).width()/2) - (popup.width()/2);
            top = offset.top + $(this).height() + 15; 
            break;

            case 'left':
            left = 230;
            top = offset.top + ($(this).height()/2) - (popup.height()/2);
            break;
        }

        var popupRightSide = left + popup.width();
        var windowRightSide = $(window).width() - 25; // assuming scrollbar takes up 25px;

        if (popupRightSide > windowRightSide) {
            left -= (popupRightSide - windowRightSide);
        }

        // Display a blocker div that removes the popup when clicked
        $('<div id="blocker"></div>').mousedown(function(event) {
            $(this).remove();
            popup.hide();
            event.stopPropagation();
        }).appendTo('body');

        popup.css({
            top: top,
            left: left
        }).show();

        return this;
    }

})(jQuery);
