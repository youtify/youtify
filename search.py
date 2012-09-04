# -*- coding: utf-8 -*-
import logging
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import Playlist
from model import YoutifyUser
from model import get_playlist_struct_from_playlist_model
from model import get_youtify_user_struct

class PlaylistSearchHandler(webapp.RequestHandler):

    def get(self):
        q = self.request.get('q').strip(' \t\n\r')
        if len(q) < 3:
            self.response.headers['Content-Type'] = 'application/json'
            self.response.out.write('[]')
            return
        ret = []
        for m in Playlist.all().search(q, properties=['title']).filter('private =', False).fetch(30):
            ret.append(get_playlist_struct_from_playlist_model(m))
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(ret))

class UserSearchHandler(webapp.RequestHandler):

    def get(self):
        q = self.request.get('q').strip(' \t\n\r')
        if len(q) < 3:
            self.response.headers['Content-Type'] = 'application/json'
            self.response.out.write('[]')
            return
        ret = []
        for m in YoutifyUser.all().search(q, properties=['nickname', 'flattr_user_name', 'first_name', 'last_name', 'tagline']).fetch(30):
            ret.append(get_youtify_user_struct(m))
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(ret))

def main():
    application = webapp.WSGIApplication([
        ('/api/search/playlists', PlaylistSearchHandler),
        ('/api/search/users', UserSearchHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
