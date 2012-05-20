import logging
import urllib
import base64
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import get_current_youtify_user_model
from activities import create_flattr_activity
try:
    import config
except ImportError:
    import config_template as config

VALIDATE_CERTIFICATE = True
FLATTR_SCOPE = 'flattr thing'

class ClickHandler(webapp.RequestHandler):
    """Flattrs a specified thing"""
    def post(self):
        thing_id = self.request.get('thing_id')
        url = 'https://api.flattr.com/rest/v2/things/' + thing_id + '/flattr'
        user = get_current_youtify_user_model()

        headers = {
            'Authorization': 'Bearer %s' % user.flattr_access_token
        }

        response = urlfetch.fetch(url=url, method=urlfetch.POST, headers=headers, validate_certificate=VALIDATE_CERTIFICATE)
        json = simplejson.loads(response.content)

        if json.get('message') == 'ok' and 'thing' in json:
            thing_id = str(json['thing'].get('id'))
            thing_title = json['thing'].get('title')
            create_flattr_activity(user, thing_id, thing_title)
        else:
            logging.error('Error creating flattr click. Response: %s' % response.content)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(response.content)

class AutoSubmitHandler(webapp.RequestHandler):
    """Flattrs a specified URL even though it may not be on flattr yet"""
    def post(self):
        url_to_submit = self.request.get('url')
        url = 'https://api.flattr.com/rest/v2/flattr'
        user = get_current_youtify_user_model()

        headers = {
            'Authorization': 'Bearer %s' % user.flattr_access_token,
            'Content-Type': 'application/json',
        }

        data = simplejson.dumps({
            'url': url_to_submit,
        })

        response = urlfetch.fetch(url=url, payload=data, method=urlfetch.POST, headers=headers, validate_certificate=VALIDATE_CERTIFICATE)
        json = simplejson.loads(response.content)

        if json.get('message') == 'ok' and 'thing' in json:
            thing_id = str(json['thing'].get('id'))
            thing_title = json['thing'].get('title')
            create_flattr_activity(user, thing_id, thing_title)
        else:
            logging.error('Error creating flattr click. Response: %s' % response.content)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(response.content)

class DisconnectHandler(webapp.RequestHandler):
    """Remove the current users access token"""
    def get(self):
        redirect_uri = self.request.get('redirect_uri', '/')
        user = get_current_youtify_user_model()
        user.flattr_access_token = None
        user.flattr_user_name = None
        user.save()
        self.redirect(redirect_uri)

class ConnectHandler(webapp.RequestHandler):
    """Initiate the OAuth dance"""
    def get(self):
        redirect_uri = self.request.get('redirect_uri')
        if redirect_uri and redirect_uri != 'deleted':
            self.response.headers['Set-Cookie'] = 'redirect_uri=' + redirect_uri
        url = 'https://flattr.com/oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s&scope=%s' % (config.CLIENT_ID, urllib.quote(config.REDIRECT_URL), urllib.quote(FLATTR_SCOPE))
        self.redirect(url)

def update_fattr_user_info(user):
    """Note, this function does not save the user model"""
    url = 'https://api.flattr.com/rest/v2/user'
    headers = {
        'Authorization': 'Bearer %s' % user.flattr_access_token,
    }
    response = urlfetch.fetch(url=url, method=urlfetch.GET, headers=headers, validate_certificate=VALIDATE_CERTIFICATE)
    response = simplejson.loads(response.content)

    if 'error_description' in response:
        raise Exception('Failed to update flattr user info for user %s - %s' % (user.google_user2.email(), response['error_description']))
    else:
        user.flattr_user_name = response['username']

class BackHandler(webapp.RequestHandler):
    """Retrieve the access token"""
    def get(self):
        code = self.request.get('code')

        url = 'https://flattr.com/oauth/token'

        headers = {
            'Authorization': 'Basic %s' % base64.b64encode(config.CLIENT_ID + ":" + config.CLIENT_SECRET),
            'Content-Type': 'application/json',
        }

        data = simplejson.dumps({
            'code': code,
            'grant_type': 'authorization_code',
        })

        response = urlfetch.fetch(url=url, payload=data, method=urlfetch.POST, headers=headers, validate_certificate=VALIDATE_CERTIFICATE)
        response = simplejson.loads(response.content)

        if 'access_token' in response:
            user = get_current_youtify_user_model()
            user.flattr_access_token = response['access_token']
            user.flattr_scope = FLATTR_SCOPE

            update_fattr_user_info(user)

            user.save()

            redirect_uri = self.request.cookies.get('redirect_uri')
            if redirect_uri:
                self.response.headers['Set-Cookie'] = 'redirect_uri=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT'
                self.redirect(redirect_uri)
            else:
                self.redirect('/')
        else:
            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('Flattr connection failed')
            self.response.out.write('\n\n')
            self.response.out.write(str(response))

def main():
    application = webapp.WSGIApplication([
        ('/flattrdisconnect', DisconnectHandler),
        ('/flattrconnect', ConnectHandler),
        ('/flattrback', BackHandler),
        ('/flattrclick', ClickHandler),
        ('/flattrautosubmit', AutoSubmitHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
