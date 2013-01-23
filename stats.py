import os
from datetime import datetime

import webapp2
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import memcache
import json as simplejson
from model import Stats
from model import YoutifyUser
from model import Playlist
from model import Activity
from model import FollowRelation
from model import PingStats

def get_flattr_stats_json():
    json = memcache.get('flattr_stats')
    if json is None:
        json = '{nr_of_users: 0, nr_of_flattrs: 0}'
    return json

class FlattrStatsCronJobHandler(webapp2.RequestHandler):

    def get(self):
        json = simplejson.dumps({
            'nr_of_users': len([i for i in YoutifyUser.all().filter('flattr_access_token !=', None)]),
            'nr_of_flattrs': len([i for i in Activity.all().filter('type =', 'outgoing').filter('verb =', 'flattr')]),
        })
        memcache.delete('flattr_stats')
        memcache.add('flattr_stats', json, 3600*24)

class StatsPageHandler(webapp2.RequestHandler):

    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'html', 'stats.html')
        self.response.out.write(template.render(path, {
            'stats': Stats.all().order('-date').get()
        }))

class CronJobHandler(webapp2.RequestHandler):

    def get(self):
        stats = Stats()

        stats.nr_of_users = 0
        stats.nr_of_active_users = 0
        stats.nr_of_playlists = len([i for i in Playlist.all()])
        stats.nr_of_users_with_flattr_account = 0
        stats.nr_of_users_with_dropbox = 0
        stats.nr_of_flattrs = len([i for i in Activity.all().filter('type =', 'outgoing').filter('verb =', 'flattr')])
        stats.nr_of_playlist_subscriptions = 0
        stats.nr_of_follow_relations = len([i for i in FollowRelation.all()])

        for user in YoutifyUser.all():
            stats.nr_of_users += 1
            
            if user.flattr_user_name:
                stats.nr_of_users_with_flattr_account += 1
            
            if user.dropbox_user_name:
                stats.nr_of_users_with_dropbox += 1

            if user.playlist_subscriptions:
                stats.nr_of_playlist_subscriptions += len(user.playlist_subscriptions)

            if user.last_login:
                delta = datetime.now() - user.last_login
                if delta.seconds < 3600 * 24 * 7:
                    stats.nr_of_active_users += 1
        
        pings = []
        last_ping = None
        for m in PingStats.all().order('-date').fetch(6*24*7):
            if last_ping is not None and last_ping.date.hour is not m.date.hour:
                pings.append({
                    'date': str(last_ping.date),
                    'pings': last_ping.pings
                })
                last_ping = m
            elif last_ping is None or m.pings > last_ping.pings:
                last_ping = m
            
        stats.pings = simplejson.dumps(pings)
        
        stats.put()

app = webapp2.WSGIApplication([
        ('/stats', StatsPageHandler),
        ('/cron/gather_stats', CronJobHandler),
        ('/cron/gather_flattr_stats', FlattrStatsCronJobHandler),
    ], debug=True)
