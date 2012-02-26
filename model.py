from google.appengine.ext import db
from google.appengine.api import users
from django.utils import simplejson
import urllib, hashlib

class YoutifyUser(db.Model):
    created = db.DateTimeProperty(auto_now_add=True)
    google_user = db.UserProperty(auto_current_user=True)
    device = db.StringProperty()
    flattr_access_token = db.StringProperty()
    flattr_user_name = db.StringProperty()
    flattr_scope = db.StringProperty()
    youtube_username = db.StringProperty()
    nickname = db.StringProperty()
    first_name = db.StringProperty()
    last_name = db.StringProperty()
    tagline = db.StringProperty()
    gravatar_email = db.StringProperty()

class Playlist(db.Model):
    owner = db.ReferenceProperty(reference_class=YoutifyUser)
    json = db.TextProperty()

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

def get_current_youtify_user():
    return get_youtify_user_for(users.get_current_user())

def get_youtify_user_for(user=None):
    return YoutifyUser.all().filter('google_user = ',user).get()

def create_youtify_user():
    m = YoutifyUser()
    m.put()
    return m

def get_current_user_json():
    user = get_current_youtify_user()
    if user is None:
        return simplejson.dumps(None)
    
    gravatar_email = user.gravatar_email or user.google_user.email()
    default_image = 'http://www.youtify.com/images/user.png'
    small_size = 64
    large_size = 208
    json = {
        'id': str(user.key().id()),
        'email': user.google_user.email(),
        'nickname': user.nickname,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'tagline': user.tagline,
        'gravatarEmail': gravatar_email,
        'smallImageUrl': "http://www.gravatar.com/avatar/" + hashlib.md5(gravatar_email.lower()).hexdigest() + "?" + urllib.urlencode({'d':default_image, 's':str(small_size)}),
        'largeImageUrl': "http://www.gravatar.com/avatar/" + hashlib.md5(gravatar_email.lower()).hexdigest() + "?" + urllib.urlencode({'d':default_image, 's':str(large_size)})
    }
    return simplejson.dumps(json)

def get_youtify_user_json_for(user=None):
    my_user = get_youtify_user_for(user)
    if my_user is None:
        return simplejson.dumps(None)
    
    gravatar_email = user.gravatar_email or user.google_user.email()
    default_image = 'http://www.youtify.com/images/user.png'
    small_size = 64
    large_size = 208
    json = {
        'id': str(my_user.key().id()),
        'email': None,
        'nickname': my_user.nickname,
        'firstName': my_user.first_name,
        'lastName': my_user.last_name,
        'tagline': my_user.tagline,
        'gravatarEmail': gravatar_email,
        'smallImageUrl': "http://www.gravatar.com/avatar/" + hashlib.md5(gravatar_email.lower()).hexdigest() + "?" + urllib.urlencode({'d':default_image, 's':str(small_size)}),
        'largeImageUrl': "http://www.gravatar.com/avatar/" + hashlib.md5(gravatar_email.lower()).hexdigest() + "?" + urllib.urlencode({'d':default_image, 's':str(large_size)})
    }
    return simplejson.dumps(json)
