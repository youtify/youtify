import logging
import os
import random
import urllib
import hashlib
from google.appengine.ext import db
from google.appengine.api import users
from django.utils import simplejson

class YoutifyUser(db.Model):
    created = db.DateTimeProperty(auto_now_add=True)
    google_user = db.UserProperty()
    google_user2 = db.UserProperty()
    device = db.StringProperty()
    flattr_access_token = db.StringProperty()
    flattr_user_name = db.StringProperty()
    flattr_scope = db.StringProperty()
    youtube_username = db.StringProperty()
    nickname = db.StringProperty()
    nickname_lower = db.StringProperty()
    first_name = db.StringProperty()
    last_name = db.StringProperty()
    tagline = db.StringProperty()
    playlists = db.ListProperty(db.Key)
    playlist_subscriptions = db.ListProperty(db.Key)
    migrated_playlists = db.BooleanProperty(default=False)

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
    target = db.TextProperty()

class Playlist(db.Model):
    owner = db.ReferenceProperty(reference_class=YoutifyUser)
    json = db.TextProperty()
    private = db.BooleanProperty()
    tracks_json = db.TextProperty()
    title = db.StringProperty()
    followers = db.ListProperty(db.Key)
    favorite = db.BooleanProperty(default=False)

class Phrase(db.Model):
    date = db.DateTimeProperty(auto_now_add=True)
    text = db.StringProperty(required=True)

class SnapshotMetadata(db.Model):
    date = db.DateTimeProperty(auto_now_add=True)
    active = db.BooleanProperty()

class SnapshotContent(db.Model):
    json = db.TextProperty(required=True)
    metadata = db.ReferenceProperty(reference_class=SnapshotMetadata)

class Language(db.Model):
    date = db.DateTimeProperty(auto_now_add=True)
    code = db.StringProperty()
    label = db.StringProperty()
    enabled_on_site = db.BooleanProperty()
    enabled_in_tool = db.BooleanProperty()
    translations = db.ListProperty(db.Key)
    leaders = db.ListProperty(db.Key)

class Translation(db.Model):
    phrase = db.ReferenceProperty(Phrase)
    text = db.StringProperty()

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

def migrate_playlists_for_youtify_user_model(youtify_user_model):
    if not youtify_user_model.migrated_playlists:
        for playlist in Playlist.all().filter('owner =', youtify_user_model):
            if playlist.json is not None:
                old_playlist = simplejson.loads(playlist.json)
                playlist.private = old_playlist.get('isPrivate', False)
                playlist.tracks_json = simplejson.dumps(old_playlist['videos'])
                playlist.owner = youtify_user_model
                playlist.title = old_playlist['title']
                playlist.remote_id = old_playlist['remoteId']
                playlist.json = None
                playlist.save()
                youtify_user_model.playlists.append(playlist.key())

        youtify_user_model.migrated_playlists = True
        youtify_user_model.google_user2 = youtify_user_model.google_user
        youtify_user_model.save()

def get_playlists_model_for_youtify_user_model(youtify_user_model):
    return db.get(youtify_user_model.playlists)

def get_followings_for_youtify_user_model(youtify_user_model):
    ret = []
    for follow_relation_model in FollowRelation.all().filter('user1 =', youtify_user_model.key().id()):
        user = YoutifyUser.get_by_id(follow_relation_model.user2)
        ret.append(get_youtify_user_struct(user, include_relations=False))
    return ret

def get_followers_for_youtify_user_model(youtify_user_model):
    ret = []
    for follow_relation_model in FollowRelation.all().filter('user2 =', youtify_user_model.key().id()):
        user = YoutifyUser.get_by_id(follow_relation_model.user1)
        ret.append(get_youtify_user_struct(user, include_relations=False))
    return ret

def get_youtify_user_struct(youtify_user_model, include_private_data=False, include_playlists=False, include_relations=True):
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
        'displayName': get_display_name_for_youtify_user_model(youtify_user_model),
        'nickname': youtify_user_model.nickname,
        'firstName': youtify_user_model.first_name,
        'lastName': youtify_user_model.last_name,
        'tagline': youtify_user_model.tagline,
        'playlists': [],
        'smallImageUrl': "http://www.gravatar.com/avatar/" + hashlib.md5(gravatar_email.lower()).hexdigest() + "?" + urllib.urlencode({'d':default_image, 's':str(small_size)}),
        'largeImageUrl': "http://www.gravatar.com/avatar/" + hashlib.md5(gravatar_email.lower()).hexdigest() + "?" + urllib.urlencode({'d':default_image, 's':str(large_size)})
    }
    if include_private_data:
        user['email'] = email

    if include_relations:
        user['followings'] = get_followings_for_youtify_user_model(youtify_user_model)
        user['followers'] = get_followers_for_youtify_user_model(youtify_user_model)
    
    if include_playlists:
        user['playlists'] = get_playlist_structs_for_youtify_user_model(youtify_user_model)
        for key in youtify_user_model.playlist_subscriptions:
            playlist_model = db.get(key)
            if playlist_model is not None:
                user['playlists'].append(get_playlist_struct_from_playlist_model(playlist_model))
            else:
                logging.error('User %s subscribes to deleted playlist %s' % (user['id'], key))
    return user

def get_display_name_for_youtify_user_model(youtify_user_model):
    if youtify_user_model.first_name and youtify_user_model.last_name:
        return youtify_user_model.first_name + ' ' + youtify_user_model.last_name
    elif youtify_user_model.first_name:
        return youtify_user_model.first_name
    elif youtify_user_model.nickname:
        return youtify_user_model.nickname
    if youtify_user_model.google_user2:
        return youtify_user_model.google_user2.nickname().split('@')[0] # don't leak users email
    else:
        return youtify_user_model.google_user.nickname().split('@')[0] # don't leak users email

def get_playlist_structs_for_youtify_user_model(youtify_user_model):
    playlist_models = youtify_user_model.playlists
    playlist_structs = []
    for key in playlist_models:
        playlist_model = db.get(key)
        playlist_structs.append(get_playlist_struct_from_playlist_model(playlist_model))
    return playlist_structs

def get_playlist_structs_by_id(playlist_id):
    playlist_model = Playlist.get_by_id(int(playlist_id))
    return get_playlist_struct_from_playlist_model(playlist_model)

def get_playlist_struct_from_playlist_model(playlist_model):
    playlist_struct = {
        'title': playlist_model.title,
        'videos': '',
        'remoteId': playlist_model.key().id(),
        'isPrivate': playlist_model.private,
        'owner': get_youtify_user_struct(playlist_model.owner, False, False),
        'followers': [],
        'favorite': playlist_model.favorite
    }
    
    for key in playlist_model.followers:
        youtify_user_model = db.get(key)
        playlist_struct['followers'].append(get_youtify_user_struct(youtify_user_model, False, False))
    
    if playlist_model.tracks_json is not None:
        playlist_struct['videos'] = simplejson.loads(playlist_model.tracks_json)
    
    return playlist_struct

def get_activities_structs(youtify_user_model):
    ret = []
    for m in Activity.all().filter('owner =', youtify_user_model).order('-timestamp'):
        ret.append({
            'timestamp': m.timestamp.strftime('%s'),
            'verb': m.verb,
            'actor': m.actor,
            'target': m.target,
        })
    return ret
