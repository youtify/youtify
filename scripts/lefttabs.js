
var LeftTabs = {
    init: function() {
        $('#toplist-tab').click(LeftTabs.toplistClick);
        $('#queue-tab').click(LeftTabs.queueClick);
        $('#search-tab').click(LeftTabs.searchClick);
    },
    tabClick: function() {
        $('#right').children().hide();
        $('#tabs li').removeClass('selected');
    },
    toplistClick: function() {
        LeftTabs.tabClick();
        $('#toplist-tab').addClass('selected');
        $('#toplist-container').show();
    },
    queueClick: function() {
        LeftTabs.tabClick();
        $('#queue-tab').addClass('selected');
        $('#queue-container').show();
    },
    searchClick: function() {
        LeftTabs.tabClick();
        $('#search-tab').addClass('selected');
        $('#search-container').show();
    },
    playlistsClick: function() {
        LeftTabs.tabClick();
    }
};