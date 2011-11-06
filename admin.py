# -*- coding: utf-8 -*-

import os
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import users
from django.utils import simplejson
from model import get_current_youtify_user
from translations import Phrase

class PhrasesHandler(webapp.RequestHandler):
    def get(self):
        json = []
        phrases = Phrase.all()
        for phrase in phrases:
            json.append({
                'original': phrase.original,
            })
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

class AdminHandler(webapp.RequestHandler):
    def get(self):
        user = get_current_youtify_user()
        path = os.path.join(os.path.dirname(__file__), 'html', 'admin.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8';
        self.response.out.write(template.render(path, {
            'my_user_name': user.google_user.nickname().split('@')[0],
            'my_user_id': user.key().id(),
            'logout_url': users.create_logout_url('/'),
        }))

def main():
    application = webapp.WSGIApplication([
        ('/admin/phrases', PhrasesHandler),
        ('/admin', AdminHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
