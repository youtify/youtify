import os
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import util
import toplist
from model import get_current_youtify_user
from model import create_youtify_user

class MainHandler(webapp.RequestHandler):

    def get(self):
        current_user = users.get_current_user()
        youtify_user = get_current_youtify_user()

        if (current_user is not None) and (youtify_user is None):
            youtify_user = create_youtify_user()

        ON_PRODUCTION = os.environ['SERVER_SOFTWARE'].startswith('Google App Engine') # http://stackoverflow.com/questions/1916579/in-python-how-can-i-test-if-im-in-google-app-engine-sdk

        path = os.path.join(os.path.dirname(__file__), 'html', 'index.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8';
        self.response.out.write(template.render(path, {
            'user': current_user,
            'youtify_user': youtify_user,
            'accept_language_header': self.request.headers['Accept-Language'],
            'logged_in': int(current_user is not None),
            'login_url': users.create_login_url('/'),
            'logout_url': users.create_logout_url('/'),
            'toplist': toplist.get_or_create_toplist_json(),
            'ON_PRODUCTION': ON_PRODUCTION,
            'ON_DEV': ON_PRODUCTION is False,
        }))

def main():
    application = webapp.WSGIApplication([
        ('/.*', MainHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
