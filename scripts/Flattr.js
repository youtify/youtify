var Flattr = {
    init: function() {
        $('#bottom .flattr').click(function() {
            $(this).arrowPopup('#flattr-popup', 'down');
            Flattr.initPopup();
        });

        $('#flattr-popup .disconnected button').click(function() {
            alert("yes");
            window.open('/flattrconnect');
        });
    },

    loadTwitter: function() {
        var screenName = 'JLo';
        var url = 'https://api.twitter.com/1/users/show.json?screen_name=' + screenName +'&include_entities=true&callback=?';
        var $twitter = $('#flattr-popup .twitter');

        $twitter.html('');

        $.getJSON(url, function(data) {
            $('<img></img>').attr('src', data.profile_image_url).appendTo($twitter);
            $('<span class="username"></span>').text(data.name + ' (@' + screenName + ')').appendTo($twitter);
        });
    },

    loadCurrentVideo: function() {
        // WIP, flattr needs to fix so that the lookup resource does not loose
        // the jsonp callback in the redirect if a thing is found,
        // alternatively pass along the jsonp callback.

        var $li = $('#flattr-popup .things .video');
        //var thingUrl = encodeURIComponent("http://www.youtify.com"); // does not work
        var thingUrl = encodeURIComponent("blog.perthulin.com");
        var url = 'https://api.flattr.com/rest/v2/things/lookup/?q=' + thingUrl + '&jsonp=?';

        $li.removeClass('found').removeClass('loading');
        $li.addClass('loading');

        console.log('loading ' + url);

        $.getJSON(url, function(data) {
              console.log(data);
              $li.removeClass('loading');
              if (data.message !== undefined && data.message === 'not_found') {
                  $li.addClass('notfound');
                  $li.find('.content').text("Not found");
              } else {
                  $li.addClass('found');
                  $li.find('.flattres').text(data.flattres);
                  $li.find('.content').text(thingUrl);
              }
          },
        });
    },

    initPopup: function() {
        if (has_flattr_access_token) { // global
            this.loadCurrentVideo();
            $('#flattr-popup .connected').show();
            $('#flattr-popup .disconnected').hide();
        } else {
            $('#flattr-popup .connected').hide();
            $('#flattr-popup .disconnected').show();
        }
    }
};
