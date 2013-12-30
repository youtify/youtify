import logging
import webapp2
from google.appengine.ext.webapp import util
import json as simplejson
from model import get_current_youtify_user_model
from model import get_display_name_for_youtify_user_model
from model import get_playlist_struct_from_playlist_model
from model import get_playlist_structs_by_id
from model import Playlist

class FavoriteHandler(webapp2.RequestHandler):

    def post(self):
        """Add a track to the favorite list"""
        youtify_user_model = get_current_youtify_user_model()
        if youtify_user_model == None:
            self.error(403)
            return

        playlist_id = self.request.path.split('/')[-1]
        playlist_model = Playlist.get_by_id(int(playlist_id))
        json = self.request.get('json', None)
        device = self.request.get('device')

        if json is None:
            self.error(400)
            return

        if playlist_model.owner.key() == youtify_user_model.key():
            if youtify_user_model.device != device:
                self.error(409)
                self.response.out.write('wrong_device')
                return
            else:
                old_playlist = simplejson.loads(json)
                playlist_model.private = old_playlist.get('isPrivate', False)
                playlist_model.tracks_json = simplejson.dumps(old_playlist['videos'])
                playlist_model.owner = youtify_user_model
                playlist_model.title = old_playlist['title']
                playlist_model.remote_id = old_playlist['remoteId']
                playlist_model.json = None
                playlist_model.save()

                self.response.out.write(str(playlist_model.key().id()))
        else:
            self.error(403)

    def delete(self):
        """Remove a track from favorites"""
        youtify_user_model = get_current_youtify_user_model()
        if youtify_user_model == None:
            self.error(403)
            return

        playlist_id = self.request.path.split('/')[-1]
        playlist_model = Playlist.get_by_id(int(playlist_id))

        if playlist_model.owner.key() == youtify_user_model.key():
            youtify_user_model.playlists.remove(playlist_model.key())
            youtify_user_model.save()

            playlist_model.delete()
        else:
            self.error(403)

app = webapp2.WSGIApplication([
        ('/api/favorites/.*', FavoriteHandler)
    ], debug=False)
