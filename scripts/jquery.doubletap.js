/* https://gist.github.com/1016011 */
(function($){

/**
* Bind an event handler to the "double tap" JavaScript event.
* @param {function} doubleTapHandler
* @param {number} [delay=300]
*/
$.fn.doubletap = function(doubleTapHandler) {
    delay = 300;

    this.bind('touchend', function(event){
        var now = new Date().getTime();

        // the first time this will make delta a negative number
        var lastTouch = $(this).data('lastTouch') || now + 1;
        var delta = now - lastTouch;
        if(delta < delay && 0 < delta){
            // After we detct a doubletap, start over
            $(this).data('lastTouch', null);

            if(doubleTapHandler !== null && typeof doubleTapHandler === 'function'){
                doubleTapHandler(event);
            }
        } else{
            $(this).data('lastTouch', now);
        }
    });
};

}(jQuery));
