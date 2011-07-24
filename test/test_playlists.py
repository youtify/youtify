import unittest
from StringIO import StringIO
from google.appengine.ext.webapp import Request
from google.appengine.ext.webapp import Response
from playlists import PlaylistsHandler
from model import Playlist
from django.utils import simplejson
from google.appengine.ext import db

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
