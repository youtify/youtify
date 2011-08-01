from google.appengine.ext import db
from google.appengine.api import users

class YoutifyUser(db.Model):
    created = db.DateTimeProperty(auto_now_add=True)
    google_user = db.UserProperty(auto_current_user=True)

class Translation(db.Model):
    text = db.StringProperty(required=True)
    user = db.ReferenceProperty(reference_class=YoutifyUser)

class Phrase(db.Model):
    original = db.StringProperty(required=True)
    sv_SE = db.ListProperty(db.Key)
    pl_PL = db.ListProperty(db.Key)

class Playlist(db.Model):
    owner = db.ReferenceProperty(reference_class=YoutifyUser)
    json = db.StringProperty()

# HELPERS
##############################################################################

def export(lang):
    ret = {}
    for phrase in Phrase.all():
        suggestions = getattr(phrase, lang)
        ret[phrase.original] = suggestions[0]
    return ret

def get_current_youtify_user():
    return get_youtify_user_for(users.get_current_user())

def get_youtify_user_for(user=None):
    # XXX will not scale, replace with filter 
    for m in YoutifyUser.all():
        if m.google_user == user:
            return m

def create_youtify_user():
    m = YoutifyUser()
    m.put()
    return m
