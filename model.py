import logging
import os
import random
import urllib
import hashlib
from google.appengine.ext import db
from google.appengine.ext import search
from google.appengine.api import users
from time import mktime

class ExternalUser(db.Model):
    type = db.StringProperty(required=True)
    external_user_id = db.StringProperty(required=True)
    username = db.StringProperty()
    avatar_url = db.StringProperty()
    subscribers = db.ListProperty(db.Key)
    nr_of_subscribers = db.IntegerProperty(default=0)
    last_updated = db.DateTimeProperty(auto_now_add=True)
    get_last_updated = db.BooleanProperty(default=True)
    
class YoutifyUser(search.SearchableModel):
    created = db.DateTimeProperty(auto_now_add=True)
    last_login = db.DateTimeProperty()
    device = db.StringProperty()
    
    google_user = db.UserProperty()
    google_user2 = db.UserProperty()
    flattr_access_token = db.StringProperty()
    flattr_user_name = db.StringProperty()
    flattr_scope = db.StringProperty()
    flattr_automatically = db.BooleanProperty(default=True)
    lastfm_user_name = db.StringProperty()
    lastfm_access_token = db.StringProperty()
    lastfm_scrobble_automatically = db.BooleanProperty(default=True)
    youtube_username = db.StringProperty()
    dropbox_access_token = db.StringProperty()
    dropbox_user_name = db.StringProperty()
    
    nickname = db.StringProperty()
    nickname_lower = db.StringProperty()
    first_name = db.StringProperty()
    last_name = db.StringProperty()
    tagline = db.StringProperty()
    playlists = db.ListProperty(db.Key)
    playlist_subscriptions = db.ListProperty(db.Key)
    last_notification_seen_timestamp = db.StringProperty()
    external_user_subscriptions = db.ListProperty(db.Key)
    nr_of_followers = db.IntegerProperty(default=0)
    nr_of_followings = db.IntegerProperty(default=0)
    nr_of_flattrs = db.IntegerProperty(default=0)
    migrated_playlists = db.BooleanProperty(default=False)

    last_emailed = db.DateTimeProperty()
    send_new_follower_email = db.BooleanProperty(default=True)
    send_new_subscriber_email = db.BooleanProperty(default=True)

    region = db.StringProperty()
    country = db.StringProperty()
    city = db.StringProperty()
    latlon = db.StringProperty()

    @classmethod
    def SearchableProperties(cls):
      return [['nickname', 'flattr_user_name', 'first_name', 'last_name', 'tagline']]

class FollowRelation(db.Model):
    """ user1 follows user2 """
    user1 = db.IntegerProperty()
    user2 = db.IntegerProperty()

class Activity(db.Model):
    """
    Loosely follows the http://activitystrea.ms standard

    From the spec:

    "In its simplest form, an activity consists of an actor, a verb, an
    object, and a target."

    Implemented activities:

    actor signed up
    actor flattred <thing>
    actor subscribed to <playlist>
    actor followed <user>
    """
    owner = db.ReferenceProperty(reference_class=YoutifyUser)
    timestamp = db.DateTimeProperty(auto_now_add=True)
    verb = db.StringProperty()
    actor = db.TextProperty()
    type = db.StringProperty()
    target = db.TextProperty()

class Playlist(search.SearchableModel):
    owner = db.ReferenceProperty(reference_class=YoutifyUser)
    json = db.TextProperty()
    private = db.BooleanProperty(default=False)
    tracks_json = db.TextProperty()
    title = db.StringProperty()
    followers = db.ListProperty(db.Key)
    nr_of_followers = db.IntegerProperty(default=0)
    favorite = db.BooleanProperty(default=False)

    @classmethod
    def SearchableProperties(cls):
      return [['title']]

class SubmittedVideo(db.Model):
    date = db.DateTimeProperty(auto_now_add=True)
    youtify_user = db.ReferenceProperty(reference_class=YoutifyUser)
    flattr_user_name = db.StringProperty()
    title = db.StringProperty()
    thing_id = db.StringProperty()
    video_id = db.StringProperty()

class FlattrClick(db.Model):
    date = db.DateTimeProperty(auto_now_add=True)
    youtify_user = db.ReferenceProperty(reference_class=YoutifyUser)
    flattr_user_name = db.StringProperty()
    thing_id = db.StringProperty()
    thing_title = db.StringProperty()
    migrated = db.BooleanProperty(default=False)

class Stats(db.Model):
    date = db.DateTimeProperty(auto_now_add=True)
    nr_of_users = db.IntegerProperty()
    nr_of_active_users = db.IntegerProperty()
    nr_of_playlists = db.IntegerProperty()
    nr_of_users_with_flattr_account = db.IntegerProperty()
    nr_of_users_with_dropbox = db.IntegerProperty()
    nr_of_flattrs = db.IntegerProperty()
    nr_of_playlist_subscriptions = db.IntegerProperty()
    nr_of_follow_relations = db.IntegerProperty()
    pings = db.TextProperty()

class PingStats(db.Model):
    date = db.DateTimeProperty(auto_now_add=True)
    pings = db.IntegerProperty(required=True)

class ExternalUserTimestamp(db.Model):
    external_user = db.ReferenceProperty(reference_class=ExternalUser)
    user = db.ReferenceProperty(reference_class=YoutifyUser)
    last_viewed = db.DateTimeProperty()

class AlternativeTrack(db.Model):
    track_id = db.StringProperty(required=True)
    track_type = db.StringProperty(required=True)
    replacement_for_id = db.StringProperty(required=True)
    replacement_for_type = db.StringProperty(required=True)
    vote = db.IntegerProperty(required=True)
    

# HELPERS
##############################################################################

def get_current_youtify_user_model():
    return get_youtify_user_model_for(users.get_current_user())

def get_youtify_user_model_for(user=None):
    return YoutifyUser.all().filter('google_user2 = ',user).get()

def get_youtify_user_model_by_nick(nick=None):
    return YoutifyUser.all().filter('nickname_lower = ', nick.lower()).get()

def get_youtify_user_model_by_id_or_nick(id_or_nick):
    if id_or_nick.isdigit():
        return YoutifyUser.get_by_id(int(id_or_nick))
    else:
        return get_youtify_user_model_by_nick(id_or_nick)

def create_youtify_user_model():
    m = YoutifyUser(google_user2=users.get_current_user(), device=str(random.random()), migrated_playlists=True)
    m.put()

    from activities import create_signup_activity # hack to avoid recursive dependency
    create_signup_activity(m)

    return m

def get_followings_for_youtify_user_model(youtify_user_model):
    ret = []
    for follow_relation_model in FollowRelation.all().filter('user1 =', youtify_user_model.key().id()):
        user = YoutifyUser.get_by_id(follow_relation_model.user2)
        ret.append(get_youtify_user_struct(user))
    return ret

def get_followers_for_youtify_user_model(youtify_user_model):
    ret = []
    for follow_relation_model in FollowRelation.all().filter('user2 =', youtify_user_model.key().id()):
        user = YoutifyUser.get_by_id(follow_relation_model.user1)
        ret.append(get_youtify_user_struct(user))
    return ret

def get_youtify_user_struct(youtify_user_model, include_private_data=False):
    if youtify_user_model.google_user2:
        email = youtify_user_model.google_user2.email()
    else:
        email = youtify_user_model.google_user.email()
    
    gravatar_email = email
    default_image = 'http://' + os.environ['HTTP_HOST'] + '/images/user.png'
    small_size = 64
    large_size = 208
    user = {
        'id': str(youtify_user_model.key().id()),
        'email': None,
        'flattr_user_name': youtify_user_model.flattr_user_name,
        'lastfm_user_name': youtify_user_model.lastfm_user_name,
        'dropbox_user_name': youtify_user_model.dropbox_user_name,
        'displayName': get_display_name_for_youtify_user_model(youtify_user_model),
        'nr_of_followers': youtify_user_model.nr_of_followers,
        'nr_of_followings': youtify_user_model.nr_of_followings,
        'nr_of_playlists': len(youtify_user_model.playlists) + len(youtify_user_model.playlist_subscriptions),
        'nr_of_flattrs': youtify_user_model.nr_of_flattrs,
        'nickname': youtify_user_model.nickname,
        'firstName': youtify_user_model.first_name,
        'lastName': youtify_user_model.last_name,
        'tagline': youtify_user_model.tagline,
        'smallImageUrl': "http://www.gravatar.com/avatar/" + hashlib.md5(gravatar_email.lower()).hexdigest() + "?" + urllib.urlencode({'d':default_image, 's':str(small_size)}),
        'largeImageUrl': "http://www.gravatar.com/avatar/" + hashlib.md5(gravatar_email.lower()).hexdigest() + "?" + urllib.urlencode({'d':default_image, 's':str(large_size)})
    }
    if include_private_data:
        user['email'] = email
    
    return user

def get_display_name_for_youtify_user_model(youtify_user_model):
    if youtify_user_model.first_name and youtify_user_model.last_name:
        return youtify_user_model.first_name + ' ' + youtify_user_model.last_name
    elif youtify_user_model.first_name:
        return youtify_user_model.first_name
    elif youtify_user_model.nickname:
        return youtify_user_model.nickname
    elif youtify_user_model.flattr_user_name:
        return youtify_user_model.flattr_user_name
    if youtify_user_model.google_user2:
        return youtify_user_model.google_user2.nickname().split('@')[0] # don't leak users email
    else:
        return youtify_user_model.google_user.nickname().split('@')[0] # don't leak users email

def get_url_for_youtify_user_model(youtify_user_model):
    if youtify_user_model.nickname:
        return 'http://www.youtify.com/' + youtify_user_model.nickname
    return 'http://www.youtify.com/users/' + str(youtify_user_model.key().id())

def get_playlist_structs_for_youtify_user_model(youtify_user_model, include_private_playlists=False):
    playlist_structs = []

    for playlist_model in db.get(youtify_user_model.playlists):
        if (not playlist_model.private) or include_private_playlists:
            playlist_structs.append(get_playlist_struct_from_playlist_model(playlist_model))

    for playlist_model in db.get(youtify_user_model.playlist_subscriptions):
        if playlist_model is not None:
            playlist_structs.append(get_playlist_struct_from_playlist_model(playlist_model))
        else:
            logging.error('User %s subscribes to deleted playlist' % (youtify_user_model.key().id()))

    return playlist_structs

def get_playlist_structs_by_id(playlist_id):
    playlist_model = Playlist.get_by_id(int(playlist_id))
    return get_playlist_struct_from_playlist_model(playlist_model)

def get_playlist_struct_from_playlist_model(playlist_model):
    playlist_struct = {
        'title': playlist_model.title,
        'videos': playlist_model.tracks_json,
        'remoteId': playlist_model.key().id(),
        'isPrivate': playlist_model.private,
        'owner': get_youtify_user_struct(playlist_model.owner),
        'followers': [],
        'favorite': playlist_model.favorite
    }
    
    for key in playlist_model.followers:
        youtify_user_model = db.get(key)
        playlist_struct['followers'].append(get_youtify_user_struct(youtify_user_model))
    
    return playlist_struct

def get_activities_structs(youtify_user_model, verbs=None, type=None, count=None):
    query = Activity.all()

    if youtify_user_model:
        query = query.filter('owner =', youtify_user_model)

    if verbs:
        query = query.filter('verb IN', verbs)

    if type:
        query = query.filter('type =', type)

    query = query.order('-timestamp')

    if count is not None:
        query = query.fetch(count)

    ret = []

    for m in query:
        ret.append({
            'timestamp': m.timestamp.strftime('%s'),
            'verb': m.verb,
            'type': m.type,
            'actor': m.actor,
            'target': m.target,
        })

    return ret

def get_settings_struct_for_youtify_user_model(youtify_user_model):
    return {
        'flattr_automatically': youtify_user_model.flattr_automatically,
        'lastfm_scrobble_automatically': youtify_user_model.lastfm_scrobble_automatically,
        'send_new_follower_email': youtify_user_model.send_new_follower_email,
        'send_new_subscriber_email': youtify_user_model.send_new_subscriber_email
    }

def get_external_user_subscription_struct(m, last_viewed=0):
    return {
        'type': m.type,
        'external_user_id': m.external_user_id,
        'username': m.username,
        'avatar_url': m.avatar_url,
        'last_updated': mktime(m.last_updated.timetuple()),
        'last_viewed': last_viewed,
    }

def get_external_user_subscriptions_struct_for_youtify_user_model(youtify_user_model):
    ret = []

    for external_user_model in db.get(youtify_user_model.external_user_subscriptions):
        last_viewed = ExternalUserTimestamp.all().filter('external_user =', external_user_model).filter('user =', youtify_user_model).get();
        last_viewed_ms = 0
        if last_viewed:
            last_viewed_ms = mktime(last_viewed.last_viewed.timetuple())
        ret.append(get_external_user_subscription_struct(external_user_model, last_viewed_ms))

    return ret

def generate_device_token():
    return str(random.random())

def get_alternative_struct(alternative_model):
    return {
        'track_id': alternative_model.track_id,
        'track_type': alternative_model.track_type,
        'replacement_for_id': alternative_model.replacement_for_id,
        'replacement_for_type': alternative_model.replacement_for_type,
        'vote': alternative_model.vote
    }