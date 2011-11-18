# -*- coding: utf-8 -*-

import os
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import users
from model import get_current_youtify_user
from translations import languages

class AdminHandler(webapp.RequestHandler):
    def get(self):
        user = get_current_youtify_user()
        path = os.path.join(os.path.dirname(__file__), 'html', 'admin.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8'
        self.response.out.write(template.render(path, {
            'my_user_name': user.google_user.nickname().split('@')[0],
            'my_user_id': user.key().id(),
            'logout_url': users.create_logout_url('/'),
            'languages': languages,
        }))

def main():
    application = webapp.WSGIApplication([
        ('/admin.*', AdminHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
