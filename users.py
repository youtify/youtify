from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from model import get_youtify_user_model_by_id_or_nick
from model import get_youtify_user_struct
from model import get_followers_for_youtify_user_model
from model import get_followings_for_youtify_user_model
from django.utils import simplejson

class FollowersHandler(webapp.RequestHandler):

    def get(self, id_or_nick):
        """Get user as JSON"""
        youtify_user_model = get_youtify_user_model_by_id_or_nick(id_or_nick)
        youtify_user_struct = None
        
        if youtify_user_model is None:
            self.error(404)
            return
        
        ret = get_followers_for_youtify_user_model(youtify_user_model)
        
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(ret))

class FollowingsHandler(webapp.RequestHandler):

    def get(self, id_or_nick):
        """Get user as JSON"""
        youtify_user_model = get_youtify_user_model_by_id_or_nick(id_or_nick)
        youtify_user_struct = None

        if youtify_user_model is None:
            self.error(404)
            return

        ret = get_followings_for_youtify_user_model(youtify_user_model)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(ret))

class UserHandler(webapp.RequestHandler):

    def get(self, id_or_nick):
        """Get user as JSON"""
        youtify_user_model = get_youtify_user_model_by_id_or_nick(id_or_nick)
        youtify_user_struct = None

        if youtify_user_model is None:
            self.error(404)
            return

        youtify_user_struct = get_youtify_user_struct(youtify_user_model, include_playlists=True)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(youtify_user_struct))

    def post(self):
        """Update user"""
        self.error(500)

def main():
    application = webapp.WSGIApplication([
        ('/api/users/(.*)/followers', FollowersHandler),
        ('/api/users/(.*)/followings', FollowingsHandler),
        ('/api/users/(.*)', UserHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
