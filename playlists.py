from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import get_current_youtify_user
from model import Playlist

class SpecificPlaylistHandler(webapp.RequestHandler):
    
    def get(self):
        """Get playlist"""
        playlist_id = self.request.path.split('/')[-1]
        youtify_user = get_current_youtify_user()
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(result.content)

    def post(self):
        """Update playlist"""
        playlist_id = self.request.path.split('/')[-1]
        youtify_user = get_current_youtify_user()
        json = self.request.get('json')

        playlist_model = db.get(db.Key(playlist_id))

        if playlist_model.owner == youtify_user:
            playlist_model.json = json
            playlist_model.save()
            self.response.out.write(str(playlist_model.key()))
        else:
            self.error(403)

def get_videos_json_for_playlist(playlist_model):
    ret = []
    for key in playlist_model.videos:
        video_model = db.get(key)
        ret.append({
            'title': video_model.title,
            'videoId': video_model.video_id,
        })
    return ret

class PlaylistsHandler(webapp.RequestHandler):

    def get(self):
        """Get logged in users playlists"""
        youtify_user = get_current_youtify_user()

        playlists = [m.json for m in Playlist.all().filter('owner =', youtify_user)]
        output = '[' + ','.join(playlists) + ']'

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(output)

    def post(self):
        """Create new playlist"""
        youtify_user = get_current_youtify_user()

        playlist_model = Playlist(owner=youtify_user, json=None)
        playlist_model.put()

        json = simplejson.loads(self.request.get('json'))
        json['remoteId'] = str(playlist_model.key())
        playlist_model.json = simplejson.dumps(json)
        playlist_model.save()

        self.response.out.write(str(playlist_model.key()))

def main():
    application = webapp.WSGIApplication([
        ('/playlists/.*', SpecificPlaylistHandler),
        ('/playlists', PlaylistsHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
