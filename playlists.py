import logging
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import get_current_youtify_user
from model import get_display_name_for_youtify_user
from model import Playlist

class SpecificPlaylistHandler(webapp.RequestHandler):
    
    def get(self):
        """Get playlist"""
        playlist_id = self.request.path.split('/')[-1]
        playlist_model = get_playlist_by_id(playlist_id)

        if playlist_model:
            self.response.headers['Content-Type'] = 'application/json'
            self.response.out.write(playlist_model)
        else:
            self.error(404)

    def post(self):
        """Update playlist"""
        youtify_user = get_current_youtify_user()
        if youtify_user == None:
            self.error(403)
            return
        
        playlist_id = self.request.path.split('/')[-1]
        playlist_model = Playlist.get_by_id(int(playlist_id))
        json = self.request.get('json', None)
        device = self.request.get('device')

        if json is None:
            self.error(400)
            return

        if playlist_model.owner.key() == youtify_user.key():
            if youtify_user.device != device:
                self.error(409)
                self.response.out.write('wrong_device')
                return
            else:
                playlist = simplejson.loads(json)
                playlist_model.private = playlist.private or False
                playlist_model.tracks_json = simplejson.dumps(playlist.videos)
                playlist_model.json = None
                playlist_model.save()
                
                self.response.out.write(str(playlist_model.key().id()))
        else:
            self.error(403)

    def delete(self):
        """Delete playlist"""
        youtify_user = get_current_youtify_user()
        if youtify_user == None:
            self.error(403)
            return
        
        playlist_id = self.request.path.split('/')[-1]
        playlist_model = Playlist.get_by_id(int(playlist_id))

        if playlist_model.owner.key() == youtify_user.key():
            playlist_model.delete()
        else:
            self.error(403)

def get_playlists_json_for_user(youtify_user):
    playlists = []

    for playlist in Playlist.all().filter('owner =', youtify_user):
        if playlist.json is None:
            logging.error("Playlist " + str(playlist.key().id()) + " has invalid JSON, skipping...")
        else:
            playlists.append(playlist.json)

    return '[' + ','.join(playlists) + ']'

class PlaylistsHandler(webapp.RequestHandler):

    def get(self):
        """Get playlists for logged in user"""
        youtify_user = get_current_youtify_user()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(get_playlists_json_for_user(youtify_user))

    def post(self):
        """Create new playlist"""
        youtify_user = get_current_youtify_user()
        json = simplejson.loads(self.request.get('json'))

        if json is None:
            self.error(500)

        playlist_model = Playlist(owner=youtify_user, json=None)
        playlist_model.put()

        json['remoteId'] = playlist_model.key().id()
        json['owner'] = {
            'id': youtify_user.key().id(),
            'name': get_display_name_for_youtify_user(youtify_user),
        }
        playlist_model.json = simplejson.dumps(json)
        playlist_model.save()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(playlist_model.json)

def main():
    application = webapp.WSGIApplication([
        ('/api/playlists/.*', SpecificPlaylistHandler),
        ('/api/playlists', PlaylistsHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
