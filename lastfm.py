import logging
import urllib
import base64

from hashlib import md5
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import get_current_youtify_user_model

try:
    import config
except ImportError:
    import config_template as config

VALIDATE_CERTIFICATE = True

class ConnectHandler(webapp.RequestHandler):
    """Initiate the Last.fm authentication dance"""
    def get(self):
        redirect_uri = self.request.get('redirect_uri')

        if redirect_uri and redirect_uri != 'deleted':
            self.response.headers['Set-Cookie'] = 'redirect_uri=' + redirect_uri

        url = 'http://www.last.fm/api/auth/?api_key=db8b8dccb3afd186b6df786775a62cb5&cb=http://0.0.0.0:8080/lastfm/callback'

        self.redirect(url)

class DisconnectHandler(webapp.RequestHandler):
    """Remove the current user's Last.fm access token"""
    def get(self):
        redirect_uri = self.request.get('redirect_uri', '/')

        user = get_current_youtify_user_model()

        user.lastfm_name = None
        user.lastfm_subscriber = None
        user.lastfm_access_token = None

        user.save()

        self.redirect(redirect_uri)

class CallbackHandler(webapp.RequestHandler):
    """Retrieve the access token"""
    def get(self):
        options = {
            'api_key': 'db8b8dccb3afd186b6df786775a62cb5',
            'method': 'auth.getSession',
            'token': self.request.get('token')
        }

        keys = options.keys()

        keys.sort()

        signature = reduce(lambda s, v: s + v, [k + options[k] for k in keys]) + '75dada4b3f3794de3be2db291c20528b'
        signature = md5(signature).hexdigest()
        options = reduce(lambda s, v: '%s&%s' % (s, v), ['%s=%s' % (k, options[k]) for k in keys])

        url = 'http://ws.audioscrobbler.com/2.0/?%s&format=json&api_sig=%s' % (options, signature)

        response = urlfetch.fetch(url=url, validate_certificate=VALIDATE_CERTIFICATE)
        session = simplejson.loads(response.content)
        
        if 'session' in session:
            user = get_current_youtify_user_model()

            user.lastfm_user_name = session['session']['name']
            user.lastfm_access_token = session['session']['key']

            user.save()

            redirect_uri = self.request.cookies.get('redirect_uri') or '/'

            self.response.headers['Set-Cookie'] = 'redirect_uri=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT'

            self.redirect('/')
        else:
            self.response.headers['Content-Type'] = 'text/plain'

            self.response.out.write('Last.fm connection failed')
            self.response.out.write('\n\n')

            self.response.out.write(str(response))

def main():
    application = webapp.WSGIApplication([
        ('/lastfm/connect', ConnectHandler),
        ('/lastfm/disconnect', DisconnectHandler),
        ('/lastfm/callback', CallbackHandler)
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
