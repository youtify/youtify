from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import urlfetch
from django.utils import simplejson

class Handler(webapp.RequestHandler):

    def get(self):
        id = self.request.get('id')
        response = urlfetch.fetch('https://api.soundcloud.com/tracks/' + id + '.json?consumer_key=206f38d9623048d6de0ef3a89fea1c4d')
        json = simplejson.loads(response.content)
        self.redirect(json['permalink_url'])

def main():
    application = webapp.WSGIApplication([
        ('/soundcloud_id_to_permalink', Handler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
