from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import get_current_youtify_user
from model import Playlist
from model import Video

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
        self.response.out.write('updating playlist')

class PlaylistsHandler(webapp.RequestHandler):

    def get(self):
        """Get logged in users playlists"""
        youtify_user = get_current_youtify_user()
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write('[]')

    def post(self):
        """Create new playlist"""
        youtify_user = get_current_youtify_user()
        title = self.request.get('title')
        videos = simplejson.loads(self.request.get('videos'))

        playlist_model = Playlist(title=title, videos=[])
        for video in videos:
            video_model = Video(
                title=video['title'],
                video_id=video['videoId']
            )
            video_model.put()
            playlist_model.videos.append(video_model.key());

        playlist_model.put()
        self.response.out.write(str(playlist_model.key()))

def main():
    application = webapp.WSGIApplication([
        ('/playlists/.*', SpecificPlaylistHandler),
        ('/playlists', PlaylistsHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
