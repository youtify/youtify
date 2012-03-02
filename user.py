import logging
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import users
from django.utils import simplejson
from model import get_current_youtify_user
from model import YoutifyUser
from model import get_youtify_user_by_nick
from model import get_current_user_json
from model import get_youtify_user_json_for

class UserHandler(webapp.RequestHandler):

    def get(self):
        """Get user as JSON"""
        user_id = self.request.path.split('/')[-1]
        if user_id is None or len(user_id) == 0:
            self.error(404)
            return
        
        user = None
        json = None
        if user_id.isdigit():
            user = YoutifyUser.get_by_id(int(user_id))
        else:
            user = get_youtify_user_by_nick(user_id)
        
        if user is None:
            self.error(404)
            return
        
        if user.google_user == users.get_current_user():
            json = get_current_user_json()
        else:
            json = get_youtify_user_json_for(user)
        
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json)

    def post(self):
        """Update user"""
        self.error(500)

def main():
    application = webapp.WSGIApplication([
        ('/api/user/.*', UserHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
