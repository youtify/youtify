var SearchStats = {
    init: function() {
        if (!SEARCH_STATS_URL) {
            return;
        }
        EventSystem.addEventListener('new_search_executed', function(q) {
            $.post(SEARCH_STATS_URL + '/entries', {q: q}, function(data) {
                console.log(data);
            });
        });
    }
};
