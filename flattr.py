import logging
import urllib
import base64
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import get_current_youtify_user
from config import CLIENT_ID
from config import CLIENT_SECRET
from config import REDIRECT_URL

class ClickHandler(webapp.RequestHandler):
    """Flattrs a specified thing"""
    def post(self):
        thing_id = self.request.get('thing_id')
        url = 'https://api.flattr.com/rest/v2/things/' + thing_id + '/flattr'
        user = get_current_youtify_user()

        headers = {
            'Authorization': 'Bearer %s' % user.flattr_access_token,
        }

        response = urlfetch.fetch(url=url, method=urlfetch.POST, headers=headers)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(response.content)

class DisconnectHandler(webapp.RequestHandler):
    """Remove the current users access token"""
    def get(self):
        user = get_current_youtify_user()
        user.flattr_access_token = None
        user.flattr_user_name = None
        user.save()
        self.redirect('/')

class ConnectHandler(webapp.RequestHandler):
    """Initiate the OAuth dance"""
    def get(self):
        url = 'https://flattr.com/oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s&scope=flattr' % (CLIENT_ID, urllib.quote(REDIRECT_URL))
        self.redirect(url)

def update_fattr_user_info(user):
    """Note, this function does not save the user model"""
    url = 'https://api.flattr.com/rest/v2/user'
    headers = {
        'Authorization': 'Bearer %s' % user.flattr_access_token,
    }
    response = urlfetch.fetch(url=url, method=urlfetch.GET, headers=headers)
    response = simplejson.loads(response.content)

    if 'error_description' in response:
        raise Exception('Failed to update flattr user info for user %s - %s' % (user.google_user.email(), response['error_description']))
    else:
        user.flattr_user_name = response['username']

class BackHandler(webapp.RequestHandler):
    """Retrieve the access token"""
    def get(self):
        code = self.request.get('code')

        url = 'https://flattr.dev/oauth/token'

        headers = {
            'Authorization': 'Basic %s' % base64.b64encode(CLIENT_ID + ":" + CLIENT_SECRET),
            'Content-Type': 'application/json',
        }

        data = simplejson.dumps({
            'code': code,
            'grant_type': 'authorization_code',
        })

        response = urlfetch.fetch(url=url, payload=data, method=urlfetch.POST, headers=headers)
        response = simplejson.loads(response.content)

        if 'access_token' in response:
            user = get_current_youtify_user()
            user.flattr_access_token = response['access_token']

            update_fattr_user_info(user)

            user.save()
            self.redirect('/')
        else:
            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('Flattr connection failed')

def main():
    application = webapp.WSGIApplication([
        ('/flattrdisconnect', DisconnectHandler),
        ('/flattrconnect', ConnectHandler),
        ('/flattrback', BackHandler),
        ('/flattrclick', ClickHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
