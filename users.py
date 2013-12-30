import webapp2
from google.appengine.ext.webapp import util
from model import get_youtify_user_model_by_id_or_nick
from model import get_youtify_user_struct
from model import get_playlist_structs_for_youtify_user_model
from model import get_followers_for_youtify_user_model
from model import get_followings_for_youtify_user_model
from model import get_activities_structs
import json as simplejson

class ActivitiesHandler(webapp2.RequestHandler):

    def get(self, id_or_nick):
        """Get activities for user as JSON"""
        youtify_user_model = get_youtify_user_model_by_id_or_nick(id_or_nick)

        verbs = self.request.get('verbs', None)
        type = self.request.get('type', None)
        count = self.request.get('count', None)

        if verbs:
            verbs = verbs.split(',')

        if count:
            count = int(count)

        if youtify_user_model is None:
            self.error(404)
            return

        ret = get_activities_structs(youtify_user_model, verbs, type, count)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(ret))

class FollowersHandler(webapp2.RequestHandler):

    def get(self, id_or_nick):
        """Get followers for user as JSON"""
        youtify_user_model = get_youtify_user_model_by_id_or_nick(id_or_nick)

        if youtify_user_model is None:
            self.error(404)
            return

        ret = get_followers_for_youtify_user_model(youtify_user_model)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(ret))

class FollowingsHandler(webapp2.RequestHandler):

    def get(self, id_or_nick):
        """Get followings for user as JSON"""
        youtify_user_model = get_youtify_user_model_by_id_or_nick(id_or_nick)

        if youtify_user_model is None:
            self.error(404)
            return

        ret = get_followings_for_youtify_user_model(youtify_user_model)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(ret))

class PlaylistsHandler(webapp2.RequestHandler):

    def get(self, id_or_nick):
        """Get playlists for user as JSON"""
        youtify_user_model = get_youtify_user_model_by_id_or_nick(id_or_nick)

        if youtify_user_model is None:
            self.error(404)
            return

        ret = get_playlist_structs_for_youtify_user_model(youtify_user_model)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(ret))

class UserHandler(webapp2.RequestHandler):

    def get(self, id_or_nick):
        """Get user as JSON"""
        youtify_user_model = get_youtify_user_model_by_id_or_nick(id_or_nick)
        youtify_user_struct = None

        if youtify_user_model is None:
            self.error(404)
            return

        youtify_user_struct = get_youtify_user_struct(youtify_user_model)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(youtify_user_struct))

    def post(self):
        """Update user"""
        self.error(500)

app = webapp2.WSGIApplication([
        ('/api/users/(.*)/activities', ActivitiesHandler),
        ('/api/users/(.*)/followers', FollowersHandler),
        ('/api/users/(.*)/followings', FollowingsHandler),
        ('/api/users/(.*)/playlists', PlaylistsHandler),
        ('/api/users/(.*)', UserHandler),
    ], debug=False)
