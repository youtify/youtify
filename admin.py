# -*- coding: utf-8 -*-

import os
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import users
from google.appengine.api.users import User
from django.utils import simplejson
from model import get_current_youtify_user
from model import YoutifyUser
from translations import languages

def get_youtify_user_by_email(email):
    try:
        youtify_user = YoutifyUser.all().filter('google_user =', User(email)).get()
        if youtify_user:
            return youtify_user
    except:
        pass

class UserLookupHandler(webapp.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        youtify_user = get_youtify_user_by_email(self.request.get('email'))
        if youtify_user:
            self.response.out.write(simplejson.dumps({
                'success': True,
                'id': str(youtify_user.key().id()),
                'nickname': youtify_user.google_user.nickname(),
                'email': youtify_user.google_user.email(),
            }))
        else:
            self.response.out.write(simplejson.dumps({
                'success': False,
            }))

class AdminHandler(webapp.RequestHandler):
    def get(self):
        user = get_current_youtify_user()
        path = os.path.join(os.path.dirname(__file__), 'html', 'admin.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8'
        self.response.out.write(template.render(path, {
            'my_user_name': user.google_user.nickname().split('@')[0],
            'my_user_email': user.google_user.email(),
            'my_user_id': user.key().id(),
            'logout_url': users.create_logout_url('/'),
            'languages': languages,
        }))

def main():
    application = webapp.WSGIApplication([
        ('/admin/userlookup', UserLookupHandler),
        ('/admin.*', AdminHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
