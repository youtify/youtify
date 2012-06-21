import logging
from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import Playlist
from model import get_playlist_struct_from_playlist_model

MEMCACHE_KEY = 'playlists_toplist'

def fetch_toplist():
    """Fetch the most popular playlists"""
    json = []
    for m in Playlist.all().order('-followers').fetch(50):
        json.append(get_playlist_struct_from_playlist_model(m))
    return simplejson.dumps(json)

def get_playlists_toplist_json():
    """ Returns an empty playlist if anything goes wrong """
    cache = memcache.get(MEMCACHE_KEY)
    if cache is None:
        return '[]'
    return cache

class CronJobHandler(webapp.RequestHandler):

    def get(self):
        json = fetch_toplist()

        memcache.delete(MEMCACHE_KEY)
        memcache.add(MEMCACHE_KEY, json, 3600*25)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json)

class ApiHandler(webapp.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(get_playlists_toplist_json())

def main():
    application = webapp.WSGIApplication([
        ('/cron/generate_playlists_toplist', CronJobHandler),
        ('/api/toplists/playlists', ApiHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
