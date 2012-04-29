# http://blog.notdot.net/2010/11/Storage-options-on-App-Engine

import os

from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

from django.utils import simplejson

class PingStats(db.Model):
    date = db.DateTimeProperty(auto_now_add=True)
    pings = db.IntegerProperty(required=True)

def get_or_create_pings():
    pings = memcache.get('pings')
    if pings is None:
        pings = 0
        memcache.add('pings', pings)
    return pings
    
class PingHandler(webapp.RequestHandler):
    """ Increment pings """

    def get(self):
        get_or_create_pings()
        memcache.incr('pings');
        self.response.out.write('')

class PingCronHandler(webapp.RequestHandler):
    """ Move pings from memcache to DB """

    def get(self):
        m = PingStats(pings=get_or_create_pings())
        m.put()
        memcache.set('pings', 0)

class PingGraphHandler(webapp.RequestHandler):
    """ Get pings for the last 24h """

    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'html', 'usersonline.html')
        json = []

        for m in PingStats.all().order('-date').fetch(6*24):
            json.append({
                'date': str(m.date),
                'pings': m.pings,
            })

        self.response.out.write(template.render(path, {
            'pings': simplejson.dumps(json),
            'npings': len(json),
        }))

def main():
    application = webapp.WSGIApplication([
        ('/cron/store_pings', PingCronHandler),
        ('/pinggraph', PingGraphHandler),
        ('/ping', PingHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
