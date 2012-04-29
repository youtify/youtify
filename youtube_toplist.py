import logging
from google.appengine.api import urlfetch
from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util

from django.utils import simplejson
from BeautifulSoup import BeautifulSoup

MEMCACHE_KEY = 'youtube_toplist'

def get_youtube_toplist_json():
    """ Returns an empty playlist if anything goes wrong """
    cache = memcache.get(MEMCACHE_KEY)
    if cache is None:
        return '[]'
    return cache

def is_video_blocked(video_id):
    url = 'http://gdata.youtube.com/feeds/api/videos/%s' % video_id;
    headers = {
        'Referer': 'http://www.youtify.com/',
    }
    result = urlfetch.fetch(url, headers=headers)

    if result.status_code != 200:
        logging.debug('is_video_blocked status code: %s' % result.status_code)

    return result.status_code != 200

class YouTubeToplistHandler(webapp.RequestHandler):

    def get(self):
        """ Scrape YouTube Top 100 Music Videos

        It's split over 5 pages with 20 videos on each.

        http://www.crummy.com/software/BeautifulSoup/documentation.html#Searching by CSS class
        """
        filter_videos = 'full' not in self.request.arguments()

        json = []
        url = 'http://www.youtube.com/charts/videos_views/music'
        result = urlfetch.fetch(url)
        soup = BeautifulSoup(result.content)

        for a in soup.findAll('a', 'video-title'):
            video_id = a.get('href').split('=')[1]
            if not is_video_blocked(video_id):
                json.append({
                    'title': a.get('title'),
                    'videoId': video_id,
                })

        json = simplejson.dumps(json)

        memcache.delete(MEMCACHE_KEY)
        memcache.add(MEMCACHE_KEY, json, 3600*25)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json)

def main():
    application = webapp.WSGIApplication([
        ('/cron/generate_youtube_toplist', YouTubeToplistHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
