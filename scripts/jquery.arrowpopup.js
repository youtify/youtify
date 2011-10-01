(function($){

    $.fn.arrowPopup = function(popupSelector, arrowDirection) {
        arrowDirection = arrowDirection || 'up';

        var popup = $(popupSelector);
        var arrow = $('<span class="arrow"></span>').addClass(arrowDirection);
        var offset = $(this).offset();

        var arrowWidth = 20;
        var arrowHeight = 10;

        var left = 0;
        var top = 0;

        var targetCenterX = offset.left + ($(this).outerWidth()/2);

        switch (arrowDirection) {
            case 'up':
            left = targetCenterX - (popup.outerWidth()/2);
            top = offset.top + $(this).outerHeight() + (arrowHeight + 5); 
            arrow.css({
                top: top - arrowHeight,
                left: targetCenterX - (arrowWidth/2)
            });
            break;

            case 'left':
            top = offset.top + ($(this).outerHeight()/2) - (popup.outerHeight()/2);
            left = 230;
            arrow.css({ // the arrow is flipped 270 degrees here
                top: top + (popup.outerHeight()/2) - (arrowWidth/2) + 5,
                left: left - (arrowHeight + 5)
            });
            break;
        }

        // Make sure the popup doesn't overflow if the window is too narrow
        var popupRightSide = left + popup.outerWidth();
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
            arrow.remove();
            popup.hide();
            event.stopPropagation();
        }).appendTo('body');

        popup.css({
            top: top,
            left: left
        }).show();

        arrow.insertAfter(popup);

        return this;
    };

}(jQuery));
