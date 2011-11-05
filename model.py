from google.appengine.ext import db
from google.appengine.api import users

class YoutifyUser(db.Model):
    created = db.DateTimeProperty(auto_now_add=True)
    google_user = db.UserProperty(auto_current_user=True)
    device = db.StringProperty()

class Playlist(db.Model):
    owner = db.ReferenceProperty(reference_class=YoutifyUser)
    json = db.TextProperty()

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
