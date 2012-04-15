import logging
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from activities import create_subscribe_activity
from model import get_current_youtify_user_model
from model import get_display_name_for_youtify_user_model
from model import get_playlist_struct_from_playlist_model
from model import get_playlist_structs_by_id
from model import Playlist

class FollowPlaylist(webapp.RequestHandler):
    
    def post(self):
        """Follows a playlist"""
        youtify_user_model = get_current_youtify_user_model()
        if youtify_user_model == None:
            self.error(403)
            return
        
        playlist_id = self.request.path.split('/')[-1]
        playlist_model = Playlist.get_by_id(int(playlist_id))
        if playlist_model is None:
            self.error(404)
            return

        if playlist_model.owner.key().id() == youtify_user_model.key().id():
            self.error(400)
            self.response.out.write('You can not subscribe to your own playlists')
            return
        
        youtify_user_model.playlist_subscriptions.append(playlist_model.key())
        youtify_user_model.save()
        
        playlist_model.followers.append(youtify_user_model.key())
        playlist_model.save()

        create_subscribe_activity(youtify_user_model, playlist_model)
        
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')
    
    def delete(self):
        """Unfollows a playlist"""
        youtify_user_model = get_current_youtify_user_model()
        if youtify_user_model == None:
            self.error(403)
            return
        
        playlist_id = self.request.path.split('/')[-1]
        playlist_model = Playlist.get_by_id(int(playlist_id))
        
        youtify_user_model.playlist_subscriptions.remove(playlist_model.key())
        youtify_user_model.save()
        
        playlist_model.followers.remove(youtify_user_model.key())
        playlist_model.save()
        
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

class SpecificPlaylistHandler(webapp.RequestHandler):
    
    def get(self):
        """Get playlist"""
        playlist_id = self.request.path.split('/')[-1]
        playlist_struct = get_playlist_structs_by_id(playlist_id)

        if playlist_struct:
            self.response.headers['Content-Type'] = 'application/json'
            self.response.out.write(simplejson.dumps(playlist_struct))
        else:
            self.error(404)

    def post(self):
        """Update playlist"""
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
        """Delete playlist"""
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

class PlaylistsHandler(webapp.RequestHandler):

    def get(self):
        """Get playlists for logged in user"""
        youtify_user_model = get_current_youtify_user_model()
        youtify_user_struct = get_youtify_user_struct(youtify_user_model, False, True)
        
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(playlists = youtify_user_struct['playlists']))

    def post(self):
        """Create new playlist"""
        youtify_user_model = get_current_youtify_user_model()
        json_playlist = simplejson.loads(self.request.get('json'))

        if json_playlist is None:
            self.error(500)

        playlist_model = Playlist(owner=youtify_user_model, json=None)
        playlist_model.private = json_playlist.get('isPrivate', False)
        playlist_model.tracks_json = None
        playlist_model.title = json_playlist['title']
        playlist_model.put()
        
        youtify_user_model.playlists.append(playlist_model.key())
        youtify_user_model.save()
        
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(get_playlist_struct_from_playlist_model(playlist_model)))

def main():
    application = webapp.WSGIApplication([
        ('/api/playlists/follow/.*', FollowPlaylist),
        ('/api/playlists/.*', SpecificPlaylistHandler),
        ('/api/playlists', PlaylistsHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
