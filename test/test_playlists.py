import unittest
from StringIO import StringIO
from google.appengine.ext import db
from google.appengine.ext.webapp import Request
from google.appengine.ext.webapp import Response
from django.utils import simplejson

from playlists import PlaylistsHandler
from playlists import SpecificPlaylistHandler
from model import Playlist

class Test(unittest.TestCase):

    def _post_playlist(self):
        json = simplejson.dumps({
            'title': 'lopez',
            'videos': [
                {
                    'title': 'video1',
                    'videoId': 'z2Am3aLwu1E',
                },
            ],
        })
        form = 'json=' + json

        handler = PlaylistsHandler()
        handler.request = Request({
            'REQUEST_METHOD': 'POST',
            'PATH_INFO': '/api/playlists',
            'wsgi.input': StringIO(form),
            'CONTENT_LENGTH': len(form),
            'SERVER_NAME': 'hi',
            'SERVER_PORT': '80',
            'wsgi.url_scheme': 'http',
        })
        handler.response = Response()
        handler.post()

        return handler.response.out.getvalue()

    def test_create_playlist(self):
        response = self._post_playlist()

        playlists = [m for m in Playlist.all()]

        self.failUnless(len(playlists) == 1)
        self.failUnless(response == str(playlists[0].key().id()))

    def test_get_playlists(self):
        self._post_playlist()
        playlists = [m for m in Playlist.all()]
        playlist_model = playlists[0]

        handler = PlaylistsHandler()
        handler.request = Request({
            'REQUEST_METHOD': 'GET',
            'PATH_INFO': '/api/playlists',
            'SERVER_NAME': 'hi',
            'SERVER_PORT': '80',
            'wsgi.url_scheme': 'http',
        })

        handler.response = Response()
        handler.get()
        response = handler.response.out.getvalue()
        response = simplejson.loads(response)

        self.failUnless(response[0]['title'] == 'lopez')
        self.failUnless(response[0]['remoteId'] == playlist_model.key().id())

    def test_update_playlists(self):
        self._post_playlist()
        playlists = [m for m in Playlist.all()]
        playlist_model = playlists[0]

        json = simplejson.dumps({
            'title': 'britney',
            'videos': [
                {
                    'title': 'oh baby baby',
                    'videoId': 'z2Am3aLwu1E',
                },
            ],
        })
        form = 'json=' + json

        handler = SpecificPlaylistHandler()
        handler.request = Request({
            'REQUEST_METHOD': 'POST',
            'PATH_INFO': '/api/playlists/' + str(playlist_model.key().id()),
            'wsgi.input': StringIO(form),
            'CONTENT_LENGTH': len(form),
            'SERVER_NAME': 'hi',
            'SERVER_PORT': '80',
            'wsgi.url_scheme': 'http',
        })

        handler.response = Response()
        handler.post()

        playlist_model = Playlist.get_by_id(1)
        json = simplejson.loads(playlist_model.json)
        self.failUnless(json['title'] == 'britney')
