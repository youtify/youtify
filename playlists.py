from google.appengine.ext import db
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

        playlists = []
        for playlist_model in Playlist.all():
            playlists.append({
                'title': playlist_model.title,
                'remoteId': str(playlist_model.key()),
                'videos': get_videos_json_for_playlist(playlist_model)
            })

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(playlists))

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
