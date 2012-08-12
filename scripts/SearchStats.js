var SearchStats = {
    timeout: null,

    init: function() {
        self = this;

        if (!SEARCH_STATS_URL) {
            return;
        }

        EventSystem.addEventListener('new_search_executed', function(q) {
            if (self.timeout) {
                clearTimeout(self.timeout);
            }
            self.timeout = setTimeout(function() {
                alert(q);
                $.post(SEARCH_STATS_URL + '/entries', {q: q}, function(data) {
                    console.log(data);
                });
            }, 5000);
        });
    }
};
