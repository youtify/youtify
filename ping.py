# http://blog.notdot.net/2010/11/Storage-options-on-App-Engine

import os

from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import users
import webapp2
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
import json as simplejson
from model import PingStats

def get_or_create_pings():
    pings = memcache.get('pings')
    if pings is None:
        pings = 0
        memcache.add('pings', pings)
    return pings

class PingHandler(webapp2.RequestHandler):
    """ Increment pings """
    def post(self):
        get_or_create_pings()
        memcache.incr('pings');
        current_user = users.get_current_user()
        if current_user == None:
            self.response.out.write('logged_out')
        else:
            self.response.out.write('ok')

    def get(self):
        get_or_create_pings()
        memcache.incr('pings');
        self.response.out.write('')

class PingCronHandler(webapp2.RequestHandler):
    """ Move pings from memcache to DB """

    def get(self):
        m = PingStats(pings=get_or_create_pings())
        m.put()
        memcache.set('pings', 0)

class PingGraphHandler(webapp2.RequestHandler):
    """ Get pings for the last 24h """

    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'html', 'usersonline.html')
        json = []

        for m in PingStats.all().order('-date').fetch(6*24*7):
            json.append({
                'date': str(m.date),
                'pings': m.pings,
            })

        self.response.out.write(template.render(path, {
            'pings': simplejson.dumps(json),
            'npings': len(json),
        }))

app = webapp2.WSGIApplication([
        ('/cron/store_pings', PingCronHandler),
        ('/stats', PingGraphHandler),
        ('/ping', PingHandler),
    ], debug=False)
