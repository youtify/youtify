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

    def test_create_playlist(self):
        videos = simplejson.dumps([
            {
                'title': 'video1',
                'videoId': 'z2Am3aLwu1E',
            },
        ])
        form = 'title=lopez&videos=' + videos

        handler = PlaylistsHandler()
        handler.request = Request({
            'REQUEST_METHOD': 'POST',
            'PATH_INFO': '/playlists',
            'wsgi.input': StringIO(form),
            'CONTENT_LENGTH': len(form),
            'SERVER_NAME': 'hi',
            'SERVER_PORT': '80',
            'wsgi.url_scheme': 'http',
        })
        handler.response = Response()
        handler.post()
        response = handler.response.out.getvalue()

        playlists = [m for m in Playlist.all()]
        self.failUnless(len(playlists) == 1)
        self.failUnless(playlists[0].title == 'lopez')
        self.failUnless(len(playlists[0].videos) == 1)
        self.failUnless(db.get(playlists[0].videos[0]).title == 'video1')
        self.failUnless(db.get(playlists[0].videos[0]).video_id == 'z2Am3aLwu1E')
        self.failUnless(response == str(playlists[0].key()))

    def test_get_playlists(self):
        playlist_model = Playlist(title='playlist1', videos=[])
        playlist_model.put()

        playlist_model = Playlist(title='playlist2', videos=[])
        playlist_model.put()

        handler = PlaylistsHandler()
        handler.request = Request({
            'REQUEST_METHOD': 'GET',
            'PATH_INFO': '/playlists',
            'SERVER_NAME': 'hi',
            'SERVER_PORT': '80',
            'wsgi.url_scheme': 'http',
        })

        handler.response = Response()
        handler.get()
        response = handler.response.out.getvalue()
        response = simplejson.loads(response)

        self.failUnless(response[1]['title'] == 'playlist2')
        self.failUnless(response[1]['remoteId'] == str(playlist_model.key()))

    def test_update_playlists(self):
        playlist_model = Playlist(title='playlist1', videos=[])
        playlist_model.put()

        form = 'title=lopez'

        handler = SpecificPlaylistHandler()
        handler.request = Request({
            'REQUEST_METHOD': 'POST',
            'PATH_INFO': '/playlists/' + str(playlist_model.key()),
            'wsgi.input': StringIO(form),
            'CONTENT_LENGTH': len(form),
            'SERVER_NAME': 'hi',
            'SERVER_PORT': '80',
            'wsgi.url_scheme': 'http',
        })

        handler.response = Response()
        handler.post()

        playlist_model = db.get(playlist_model.key())
        self.failUnless(playlist_model.title == 'lopez')
