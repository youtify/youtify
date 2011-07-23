from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson

from model import get_current_youtify_user

class SpecificPlaylistHandler(webapp.RequestHandler):
    
    def get(self):
        """Get videos from specific playlist"""
        playlist_id = self.request.path.split('/')[-1]
        youtify_user = get_current_youtify_user()
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(result.content)

    def post(self):
        """Update specific playlist"""
        playlist_id = self.request.path.split('/')[-1]
        youtify_user = get_current_youtify_user()

class PlaylistsHandler(webapp.RequestHandler):

    def get(self):
        """Get logged in users playlists"""
        youtify_user = get_current_youtify_user()
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write('[]')

    def post(self):
        """Create new playlist with submitted title and videos"""
        youtify_user = get_current_youtify_user()
        self.response.out.write('123')

def main():
    application = webapp.WSGIApplication([
        ('/playlists/.*', SpecificPlaylistHandler),
        ('/playlists', PlaylistsHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
