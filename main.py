import os
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import util
import toplist
from model import get_current_youtify_user
from model import create_youtify_user
import random
import re

class MainHandler(webapp.RequestHandler):

    def get(self):
        current_user = users.get_current_user()
        youtify_user = get_current_youtify_user()
        if youtify_user is not None:
            youtify_user.device = str(random.random())
            youtify_user.save()

        if (current_user is not None) and (youtify_user is None):
            youtify_user = create_youtify_user()

        ON_PRODUCTION = os.environ['SERVER_SOFTWARE'].startswith('Google App Engine') # http://stackoverflow.com/questions/1916579/in-python-how-can-i-test-if-im-in-google-app-engine-sdk
        
        # Find videotag and generate open graph meta tags
        match = re.compile(r'videos/(.*)').search(self.request.url)
        if match: 
            og_tag = '<meta property="og:video" content="http://www.youtube.com/v/' + match.groups()[0] + '?version=3&amp;autohide=1"/><meta property="og:video:type" content="application/x-shockwave-flash"/><meta property="og:video:width" content="396"/><meta property="og:video:height" content="297"/>'
        else:
            og_tag = ''
        
        path = os.path.join(os.path.dirname(__file__), 'html', 'index.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8';
        self.response.out.write(template.render(path, {
            'user': current_user,
            'youtify_user': youtify_user,
            'accept_language_header': self.request.headers.get('Accept-Language', ''),
            'logged_in': int(current_user is not None),
            'login_url': users.create_login_url('/'),
            'logout_url': users.create_logout_url('/'),
            'toplist': toplist.get_or_create_toplist_json(),
            'ON_PRODUCTION': ON_PRODUCTION,
            'ON_DEV': ON_PRODUCTION is False,
            'USE_PRODUCTION_JAVASCRIPT': ON_PRODUCTION,
            #'USE_PRODUCTION_JAVASCRIPT': True, # Uncomment to try out production settings. Remember to build production.js with localhost:8080/minimizer
			'url': self.request.url,
            'og_tag': og_tag,
        }))

def main():
    application = webapp.WSGIApplication([
        ('/.*', MainHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
