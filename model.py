import os
import urllib
import hashlib
from google.appengine.ext import db
from google.appengine.api import users
from django.utils import simplejson

class YoutifyUser(db.Model):
    created = db.DateTimeProperty(auto_now_add=True)
    google_user = db.UserProperty(auto_current_user=True)
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
    followings = db.ListProperty(db.Key)
    followers = db.ListProperty(db.Key)

class Playlist(db.Model):
    owner = db.ReferenceProperty(reference_class=YoutifyUser)
    json = db.TextProperty()
    private = db.BooleanProperty()
    tracks_json = db.TextProperty()
    title = db.StringProperty()

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

# HELPERS
##############################################################################

def get_current_youtify_user_model():
    return get_youtify_user_model_for(users.get_current_user())

def get_youtify_user_model_for(user=None):
    return YoutifyUser.all().filter('google_user = ',user).get()

def get_youtify_user_model_by_nick(nick=None):
    return YoutifyUser.all().filter('nickname_lower = ', nick.lower()).get()

def get_youtify_user_model_by_id_or_nick(id_or_nick):
    if id_or_nick.isdigit():
        return YoutifyUser.get_by_id(int(id_or_nick))
    else:
        return get_youtify_user_by_nick(id_or_nick)

def create_youtify_user_model():
    m = YoutifyUser()
    m.put()
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
        youtify_user_model.save()

def get_playlists_model_for_youtify_user_model(youtify_user_model):
    return db.get(youtify_user_model.playlists)

def get_followings_for_youtify_user_model(youtify_user_model):
    ret = []
    for key in youtify_user_model.followings:
        user = db.get(key)
        ret.append({
            'id': str(user.key().id()),
            'name': get_display_name_for_youtify_user_model(youtify_user_model),
        })
    return ret

def get_followers_for_youtify_user_model(youtify_user_model):
    ret = []
    for key in youtify_user_model.followers:
        user = db.get(key)
        ret.append({
            'id': str(user.key().id()),
            'name': get_display_name_for_youtify_user_model(youtify_user_model),
        })
    return ret

def get_youtify_user_struct(youtify_user_model, include_private_data=False, include_playlists=False):
    email = youtify_user_model.google_user.email()
    gravatar_email = email
    default_image = 'http://' + os.environ['HTTP_HOST'] + '/images/user.png'
    small_size = 64
    large_size = 208
    user = {
        'id': str(youtify_user_model.key().id()),
        'email': None,
        'nickname': get_display_name_for_youtify_user_model(youtify_user_model),
        'firstName': youtify_user_model.first_name,
        'lastName': youtify_user_model.last_name,
        'tagline': youtify_user_model.tagline,
        'followings': get_followings_for_youtify_user_model(youtify_user_model),
        'followers': get_followers_for_youtify_user_model(youtify_user_model),
        'playlists': [],
        'smallImageUrl': "http://www.gravatar.com/avatar/" + hashlib.md5(gravatar_email.lower()).hexdigest() + "?" + urllib.urlencode({'d':default_image, 's':str(small_size)}),
        'largeImageUrl': "http://www.gravatar.com/avatar/" + hashlib.md5(gravatar_email.lower()).hexdigest() + "?" + urllib.urlencode({'d':default_image, 's':str(large_size)})
    }
    if include_private_data:
        user['email'] = email
    
    if include_playlists:
        user['playlists'] = get_playlist_structs_for_youtify_user_model(youtify_user_model)
    
    return user

def get_display_name_for_youtify_user_model(youtify_user_model):
    if youtify_user_model.nickname:
        return youtify_user_model.nickname
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
        'owner': get_youtify_user_struct(playlist_model.owner, False, False)
    }
    if playlist_model.tracks_json is not None:
        playlist_struct['videos'] = simplejson.loads(playlist_model.tracks_json)
    
    return playlist_struct
