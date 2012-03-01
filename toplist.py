from google.appengine.api import urlfetch
from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util

from django.utils import simplejson
from BeautifulSoup import BeautifulSoup
from filter import blocked_youtube_videos

def scrape_toplist():
    """ Scrape YouTube Top 100 Music Videos

    It's split over 5 pages with 20 videos on each.

    http://www.crummy.com/software/BeautifulSoup/documentation.html#Searching by CSS class
    """
    json = []
    url = 'http://www.youtube.com/charts/videos_views/music'
    result = urlfetch.fetch(url)
    soup = BeautifulSoup(result.content)

    for a in soup.findAll('a', 'video-title'):
        video_id = a.get('href').split('=')[1]
        if not video_id in blocked_youtube_videos:
            json.append({
                'title': a.get('title'),
                'videoId': video_id,
            })

    return simplejson.dumps(json)

def get_or_create_toplist_json():
    """ Returns an empty playlist if anything goes wrong """
    cache = memcache.get('toplist')
    if cache is not None:
        return cache
    try:
        json = scrape_toplist()
    except:
        return '[]'
    memcache.add('toplist', json, 3600*24)
    return json

class ToplistHandler(webapp.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(get_or_create_toplist_json())

def main():
    application = webapp.WSGIApplication([
        ('/toplist', ToplistHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
