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
    '36730249', # Previously on mobileMacs 080
    '9Ijq4593DQ4', # Abused Romance - Vaporize - Official music video
    'Z59gKflk2zA', # Abused Romance - Sound of Violence
    'cp_am5HUyic', # Emule & BitTorrent Sites & Users Ruled 100% Legal In Spain Thanks To The \" SGAE \" Music Mafia.
    't46-zfS-pAQ', # Abused Romance - Hit and Run - Official music video
]

def fetch_toplist():
    """Fetch the top flattred YouTube videos"""
    json = []
    url = 'https://api.flattr.com/rest/v2/things/search?url=youtube.com|soundcloud.com&tags=music&sort=trend&count=100'
    result = urlfetch.fetch(url)
    result = simplejson.loads(result.content)

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
        elif url.netloc.startswith('soundcloud.com'):
            try:
                params = url.path.split('/')
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
                logging.error('failed to do soundcloud lookup for ' + thing['url'])

    return simplejson.dumps(json)

def get_flattr_toplist_json():
    """ Returns an empty playlist if anything goes wrong """
    cache = memcache.get(MEMCACHE_KEY)
    if cache is None:
        return '[]'
    return cache

class FlattrToplistHandler(webapp.RequestHandler):

    def get(self):
        json = fetch_toplist()

        memcache.delete(MEMCACHE_KEY)
        memcache.add(MEMCACHE_KEY, json, 3600*25)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json)

def main():
    application = webapp.WSGIApplication([
        ('/cron/generate_flattr_toplist', FlattrToplistHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
