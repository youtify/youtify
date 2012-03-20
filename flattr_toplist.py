import logging
import urlparse
from time import sleep
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

FILTER = [
    'RCm56g1SxLw', # Berlin - Der goldene Reiter
    '33802859', # Previously on mobileMacs 078
    '35304875', # Previously on mobileMacs 079
    '30018757', # Previously on mobileMacs 077
    '29243672', # Previously on mobileMacs 076
    '33802859', # Previously on mobileMacs 078
    '35304875', # Previously on mobileMacs 079
    '9Ijq4593DQ4', # Abused Romance - Vaporize - Official music video
    'Z59gKflk2zA', # Abused Romance - Sound of Violence
    'cp_am5HUyic', # Emule & BitTorrent Sites & Users Ruled 100% Legal In Spain Thanks To The \" SGAE \" Music Mafia.
    't46-zfS-pAQ', # Abused Romance - Hit and Run - Official music video
]

def fetch_toplist():
    """Fetch the top flattred YouTube videos"""
    json = []

    i = 0
    while True:
        i += 1
        url = 'https://api.flattr.com/rest/v2/things/search?query=youtube&tags=music&sort=flattrs&page=%i' % i
        result = urlfetch.fetch(url)
        result = simplejson.loads(result.content)
        if i < 5 and 'things' in result and len(result['things']) > 0:
            for thing in result['things']:
                url = urlparse.urlparse(thing['url'])
                if url.netloc.startswith('www.youtube.com'):
                    params = dict(parse_qsl(url.query))
                    if 'v' in params and not params['v'] in FILTER:
                        json.append({
                            'title': thing['title'],
                            'videoId': params['v'],
                            'flattrs': thing['flattrs'],
                            'flattrThingId': thing['id'],
                            'type': 'youtube',
                            'duration': None,
                        })
        else:
            break
    
    i = 0
    while True:
        i += 1
        url = 'https://api.flattr.com/rest/v2/things/search?url=soundcloud.com&tags=music&count=10&sort=flattrs&page=%i' % i
        result = urlfetch.fetch(url)
        result = simplejson.loads(result.content)
        if i < 2 and 'things' in result and len (result['things']) > 0:
            for thing in result['things']:
                url = urlparse.urlparse(thing['url'])
                params = url.path.split('/')
                if len(params) == 3:
                    sleep(1)
                    try:
                        scresult = urlfetch.fetch('https://api.soundcloud.com/resolve.json?consumer_key=206f38d9623048d6de0ef3a89fea1c4d&url=' + thing['url'])
                        scresult = simplejson.loads(scresult.content)
                        if 'streamable' in scresult and scresult['streamable'] and (str(scresult['id']) not in FILTER):
                            json.append({
                                'title': scresult['title'],
                                'videoId': scresult['id'],
                                'flattrs': thing['flattrs'],
                                'flattrThingId': thing['id'],
                                'type': 'soundcloud',
                                'duration': scresult['duration'],
                            })
                    except:
                        sleep(1)
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
