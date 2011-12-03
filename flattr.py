import urllib
import base64
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import get_current_youtify_user
from config import FLATTR_URL
from config import CLIENT_ID
from config import CLIENT_SECRET
from config import REDIRECT_URL

class Handler(webapp.RequestHandler):
    def get(self):
        url = FLATTR_URL + '/oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s&scope=flattr' % (CLIENT_ID, urllib.quote(REDIRECT_URL))
        self.redirect(url)

class BackHandler(webapp.RequestHandler):
    def get(self):
        code = self.request.get('code')

        url = FLATTR_URL + '/oauth/token'

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
            user.save()
            self.redirect('/')
        else:
            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('Flattr connection failed')

def main():
    application = webapp.WSGIApplication([
        ('/flattrconnect', Handler),
        ('/flattrback', BackHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
