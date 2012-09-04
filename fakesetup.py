from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import urlfetch
from django.utils import simplejson
from model import get_current_youtify_user_model
from model import Playlist
from model import ExternalUser
from config import ON_PRODUCTION

EXTERNAL_USERS = (
    ('soundcloud', 'mosaik'),
    ('soundcloud', 'rebeccafiona'),
    ('soundcloud', '50_cent'),
    ('soundcloud', 'opiuo'),
    ('soundcloud', 'bonnie-bailey'),
    ('soundcloud', 'latenightalumni'),
    ('soundcloud', 'madeon'),
    ('soundcloud', 'madeofsweden'),
    ('soundcloud', 'musicofmason'),
    ('soundcloud', 'amandapalmer'),
    ('soundcloud', 'infinityshred'),
    ('soundcloud', 'yelle'),
    ('soundcloud', 'professorkliq'),
    ('soundcloud', 'quiet-company'),
    ('soundcloud', 'manicfocus'),
    ('soundcloud', 'monstercatmedia'),
    ('soundcloud', 'sambillen-1'),
    ('soundcloud', 'm54one'),
    ('soundcloud', 'chriszabriskie'),
    ('soundcloud', 'ellie-goulding'),
    ('soundcloud', 'karmin'),
    ('soundcloud', 'therescues'),
    ('soundcloud', 'jaymonis'),
    ('soundcloud', 'erin-mckeown'),
    ('soundcloud', 'tiesto_official'),
    ('soundcloud', 'aaahh-records'),
    ('soundcloud', 'Phonoelit'),
    ('soundcloud', 'beltek'),
)

class Handler(webapp.RequestHandler):

    def get(self):
        user = get_current_youtify_user_model()

        if ON_PRODUCTION:
            return

        for type, username in EXTERNAL_USERS:
            url = 'http://soundcloud.com/' + username
            response = urlfetch.fetch('https://api.soundcloud.com/resolve.json?consumer_key=206f38d9623048d6de0ef3a89fea1c4d&url=' + url);
            response = simplejson.loads(response.content)
            external_user_model = ExternalUser(type=type, external_user_id=str(response['id']), username=username, avatar_url=response['avatar_url']) 
            external_user_model.save()
            user.external_user_subscriptions.append(external_user_model.key())
            user.save()
            external_user_model.subscribers.append(user.key())
            external_user_model.save()

        self.redirect('/')
        return

        for i in range(0,50):
            tracks_json = []
            for j in range(0, 100):
                tracks_json.append({
                    "videoId": 27985183,
                    "title": "Oceanic Crust",
                    "duration": 106331,
                    "type": "soundcloud"
                })
            m = Playlist(owner=user, title="Mosaik " + str(i), tracks_json=simplejson.dumps(tracks_json), json=None)
            m.put()

            user.playlists.append(m.key())
            user.save()

        self.redirect('/')

def main():
    application = webapp.WSGIApplication([
        ('/.*', Handler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()

