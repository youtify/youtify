import logging
import urlparse
from google.appengine.api import urlfetch
from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
try:
    from urlparse import parse_qsl
except ImportError:
    from cgi import parse_qsl

MEMCACHE_KEY = 'flattr_toplist'

def fetch_toplist():
    """Fetch the top flattred YouTube videos"""
    json = []

    i = 0
    while True:
        i += 1
        url = 'https://api.flattr.com/rest/v2/things/search?query=youtube&tags=music&page=%i' % i
        result = urlfetch.fetch(url)
        result = simplejson.loads(result.content)
        if i < 5 and 'things' in result and len(result['things']) > 0:
            for thing in result['things']:
                url = urlparse.urlparse(thing['url'])
                if url.netloc.startswith('www.youtube.com'):
                    params = dict(parse_qsl(url.query))
                    if 'v' in params:
                        json.append({
                            'title': thing['title'],
                            'videoId': params['v'],
                            'flattrs': thing['flattrs'],
                        })
        else:
            break

    json = sorted(json, key=lambda thing: thing['flattrs'], reverse=True)

    return simplejson.dumps(json)

def get_or_create_toplist_json():
    """ Returns an empty playlist if anything goes wrong """
    cache = memcache.get(MEMCACHE_KEY)
    if cache is not None:
        return cache
    try:
        json = fetch_toplist()
    except:
        logging.error('Error generating %s' % (MEMCACHE_KEY))
        return '[]'
    memcache.add(MEMCACHE_KEY, json, 3600*24)
    return json

class ToplistHandler(webapp.RequestHandler):

    def get(self):
        if 'flush' in self.request.arguments():
            memcache.delete(MEMCACHE_KEY)
            logging.debug('Flushed memcache for %s' % MEMCACHE_KEY)
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(get_or_create_toplist_json())

def main():
    application = webapp.WSGIApplication([
        ('/flattr_toplist', ToplistHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
