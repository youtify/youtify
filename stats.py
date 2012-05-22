import os

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from model import Stats
from model import YoutifyUser
from model import Playlist
from model import Activity
from model import FollowRelation

class StatsPageHandler(webapp.RequestHandler):

    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'html', 'stats.html')
        self.response.out.write(template.render(path, {
            'stats': Stats.all().order('-date').get()
        }))

class CronJobHandler(webapp.RequestHandler):

    def get(self):
        stats = Stats()
        stats.nr_of_users = len([i for i in YoutifyUser.all()])
        stats.nr_of_users_with_flattr_account = len([i for i in YoutifyUser.all().filter('flattr_access_token !=', None)])
        stats.nr_of_playlists = len([i for i in Playlist.all()])
        stats.nr_of_flattrs = len([i for i in Activity.all().filter('verb =', 'flattr')])
        stats.nr_of_playlist_subscriptions = len([i for i in Activity.all().filter('verb =', 'subscribe')])
        stats.nr_of_follow_relations = len([i for i in FollowRelation.all()])
        stats.put()

def main():
    application = webapp.WSGIApplication([
        ('/stats', StatsPageHandler),
        ('/cron/gather_stats', CronJobHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
