function Tabs($wrapper, callbacks) {
    var self = this;

    self.callbacks = callbacks || {};
    self.$selectedTab = null;
    self.$selectedPane = null;
    self.$wrapper = $wrapper;

    self.$wrapper.find('.tabs li').click(function() {
        self.select($(this).attr('rel'));
    });

    self.select = function(paneClassName) {
        if (self.$selectedTab) {
            self.$selectedTab.removeClass('selected');
        }
        if (self.$selectedPane) {
            self.$selectedPane.removeClass('selected');
        }

        if (self.callbacks.hasOwnProperty(paneClassName)) {
            self.callbacks[paneClassName]();
        }

        self.$selectedTab = self.$wrapper.find('.tabs .' + paneClassName);
        self.$selectedPane = self.$wrapper.find('.pane.' + paneClassName);

        self.$selectedTab.addClass('selected');
        self.$selectedPane.addClass('selected');
    };
}
