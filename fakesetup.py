from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import get_current_youtify_user_model
from model import Playlist
from config import ON_PRODUCTION

class Handler(webapp.RequestHandler):

    def get(self):
        user = get_current_youtify_user_model()

        if ON_PRODUCTION:
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

