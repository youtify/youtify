var Activities = {
    getSignupActivity: function() {
        return $('<div class="activity">' + TranslationSystem.get('You joined Youtify') + '</div>'); 
    },

    getIncomingSubscribeActivityView: function(actor, playlist) {
        var $user = '<span class="user small link"><img src="' + actor.smallImageUrl + '"/><span clas="name">' + Utils.escape(actor.displayName) + '</span></span>';
        var $playlist = '<span class="link playlist">' + Utils.escape(playlist.title) + '</span>';
        var $div = $('<div class="activity">' + TranslationSystem.get('$user subscribed to your playlist $playlist', {$playlist: $playlist, $user: $user}) + '</div>'); 
        $div.find('.link.user').click(actor.goTo);
        $div.find('.link.playlist').click(playlist.goTo);
        return $div;
    },

    getOutgoingSubscribeActivityView: function(playlist) {
        var $user = '<span class="user small link"><img src="' + playlist.owner.smallImageUrl + '"/><span clas="name">' + Utils.escape(playlist.owner.displayName) + '</span></span>';
        var $playlist = '<span class="link playlist">' + Utils.escape(playlist.title) + '</span>';
        var $div = $('<div class="activity">' + TranslationSystem.get('You subscribed to $playlist by $user', {$playlist: $playlist, $user: $user}) + '</div>'); 
        $div.find('.link.user').click(playlist.owner.goTo);
        $div.find('.link.playlist').click(playlist.goTo);
        return $div;
    },

    getIncomingExternalSubscribeActivity: function(actor, externalUser) {
        var $user = '<span class="user small link"><img src="' + actor.smallImageUrl + '"/><span clas="name">' + Utils.escape(actor.displayName) + '</span></span>';
        var $externalUser = '<span class="link external-user">' + Utils.escape(externalUser.username) + '</span>';
        var $div = $('<div class="activity">' + TranslationSystem.get('$user subscribed to $externalUser', {$externalUser: $externalUser, $user: $user}) + '</div>'); 
        $div.find('.link.user').click(actor.goTo);
        $div.find('.link.external-user').click(externalUser.goTo);
        return $div;
    },

    getOutgoingExternalSubscribeActivity: function(externalUser) {
        var $externalUser = '<span class="link external-user">' + Utils.escape(externalUser.username) + '</span>';
        var $div = $('<div class="activity">' + TranslationSystem.get('You subscribed to $externalUser', {$externalUser: $externalUser}) + '</div>'); 
        $div.find('.link.external-user').click(externalUser.goTo);
        return $div;
    },

    getOutgoingFollowActivity: function(otherUser) {
        var $user = '<span class="user small link"><img src="' + otherUser.smallImageUrl + '"/><span class="name">' + Utils.escape(otherUser.displayName) + '</span></span>';
        var $div = $('<div class="activity">' + TranslationSystem.get('You started following $user', {$user: $user}) + '</div>');
        $div.find('.link.user').click(otherUser.goTo);
        return $div;
    },

    getIncomingFollowActivity: function(actor) {
        var $user = '<span class="user small link"><img src="' + actor.smallImageUrl + '"/><span class="name">' + Utils.escape(actor.displayName) + '</span></span>';
        var $div = $('<div class="activity">' + TranslationSystem.get('$user started following you', {$user: $user}) + '</div>');
        $div.find('.link.user').click(actor.goTo);
        return $div;
    },

    getOutgoingFlattrActivity: function(thing) {
        var thingUrl = 'https://flattr.com/t/' + thing.thing_id;
        var thingTitle = thing.thing_title || thingUrl;
        var $thing = '<a class="thing link" href="' + thingUrl + '" target="_blank">' + thingTitle + '</a>';
        return $('<div class="activity">' + TranslationSystem.get('You flattred $thing', {$thing: $thing}) + '</div>');
    },

    getIncomingFlattrActivity: function(actor, thing) {
        var thingUrl = 'https://flattr.com/t/' + thing.thing_id;
        var thingTitle = thing.thing_title || thingUrl;
        var $thing = '<a class="thing link" href="' + thingUrl + '" target="_blank">' + thingTitle + '</a>';
        var $user = '<span class="user small link"><img src="' + actor.smallImageUrl + '"/><span class="name">' + Utils.escape(actor.displayName) + '</span></span>';
        var $div = $('<div class="activity">' + TranslationSystem.get('$user flattred $thing', {$user: $user, $thing: $thing}) + '</div>');
        $div.find('.link.user').click(actor.goTo);
        return $div;
    },

    getActivityElem: function(activity) {
        var $div = $('<div class="activity"></div>'),
            actor = null,
            otherUser = null,
            playlist = null,
            externalUser = null,
            thing = null;

        switch (activity.verb) {
            case 'follow':
                actor = new User(JSON.parse(activity.actor));
                otherUser = new User(JSON.parse(activity.target));
                if (otherUser.id === UserManager.currentUser.id) {
                    $div = Activities.getIncomingFollowActivity(actor);
                } else if (actor.id === UserManager.currentUser.id) {
                    $div = Activities.getOutgoingFollowActivity(otherUser);
                }
            break;

            case 'subscribe':
                actor = new User(JSON.parse(activity.actor));
                playlist = JSON.parse(activity.target);
                playlist = new Playlist(playlist.title, playlist.videos, playlist.remoteId, playlist.owner, playlist.isPrivate);
                if (playlist.owner.id === UserManager.currentUser.id) {
                    $div = Activities.getIncomingSubscribeActivityView(actor, playlist);
                } else if (actor.id === UserManager.currentUser.id) {
                    $div = Activities.getOutgoingSubscribeActivityView(playlist);
                }
            break;

            case 'external_subscribe':
                actor = new User(JSON.parse(activity.actor));
                externalUser = new ExternalUserSubscription(JSON.parse(activity.target));
                if (actor.id === UserManager.currentUser.id) {
                    $div = Activities.getOutgoingExternalSubscribeActivity(externalUser);
                } else {
                    $div = Activities.getIncomingExternalSubscribeActivity(actor, externalUser);
                }
            break;

            case 'signup':
                $div = Activities.getSignupActivity();
            break;

            case 'flattr':
                actor = new User(JSON.parse(activity.actor));
                thing = JSON.parse(activity.target);
                if (actor.id === UserManager.currentUser.id) {
                    $div = Activities.getOutgoingFlattrActivity(thing);
                } else {
                    $div = Activities.getIncomingFlattrActivity(actor, thing);
                }
            break;
        }

        $div.append('<span class="timestamp"> ' + jQuery.timeago(new Date(Number(activity.timestamp * 1000))) + '</span>');

        return $div;
    },

    loadNotificationsPopup: function() {
        var $ul = $('#activities-popup ul');
        $ul.html('');
        LoadingBar.show();
        $.get('/api/users/' + UserManager.currentUser.id + '/activities?type=incoming&verbs=follow,subscribe&count=50', function(data) {
            $.each(data, function(i, activity) {
                $ul.append(Activities.getActivityElem(activity));
            });
            LoadingBar.hide();
        });
    }
};
