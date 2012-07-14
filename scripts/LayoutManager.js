var LayoutManager = {
    self: this,
    width: 0,
    height: 0
    init: function() {
        self.width = $(window).width();
        self.height = $(window).height();
        
        $('#left .menu > li').click(function() {
            if (self.width <= 320) {
                $('body').animate({scrollLeft: self.width}, 200);
            }
        });
    }
    
};