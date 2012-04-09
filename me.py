from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import get_current_youtify_user_model
from model import get_youtify_user_struct
from model import YoutifyUser
from model import FollowRelation
from model import get_activities_structs
from model import get_display_name_for_youtify_user_model
from activities import create_follow_activity

class ProfileHandler(webapp.RequestHandler):
    def get(self):
        user = get_current_youtify_user_model()
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(get_youtify_user_struct(get_current_youtify_user_model())))

    def post(self):
        user = get_current_youtify_user_model()
        nickname = self.request.get('nickname', user.nickname)
        first_name = self.request.get('first_name', user.first_name)
        last_name = self.request.get('last_name', user.first_name)
        tagline = self.request.get('tagline', user.tagline)

        for u in YoutifyUser.all().filter('nickname_lower = ', nickname.lower()):
            if str(u.key().id()) != str(user.key().id()):
                self.error(409)
                self.response.out.write('Nickname is already taken')
                return

        user.nickname = nickname
        user.nickname_lower = nickname.lower()
        user.first_name = first_name
        user.last_name = last_name
        user.tagline = tagline

        user.save()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(get_display_name_for_youtify_user_model(user))

class FollowingsHandler(webapp.RequestHandler):

    def delete(self, uid):
        me = get_current_youtify_user_model()
        m = FollowRelation.all().filter('user1 =', me.key().id()).filter('user2 =', int(uid)).get()
        if m:
            m.delete()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

    def post(self, uid):
        other_user = YoutifyUser.get_by_id(int(uid))
        me = get_current_youtify_user_model()

        if other_user is None:
            self.error(400)
            self.response.out.write('Other user not found')
            return

        if me.key().id() == other_user.key().id():
            self.error(400)
            self.response.out.write('You can not follow yourself')
            return

        if FollowRelation.all().filter('user1 =', me).filter('user2 =', other_user).get():
            self.error(400)
            self.response.out.write('You already follow that user')
            return

        m = FollowRelation(user1=me.key().id(), user2=other_user.key().id())
        m.put()

        create_follow_activity(me, other_user)

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

class ActivitiesHandler(webapp.RequestHandler):

    def get(self):
        """ Get all users activities """
        me = get_current_youtify_user_model()
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(get_activities_structs(me)))

class YouTubeUserNameHandler(webapp.RequestHandler):
    def get(self):
        user = get_current_youtify_user_model()
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(user.youtube_username)

    def post(self):
        username = self.request.get('username')

        user = get_current_youtify_user_model()
        user.youtube_username = username 
        user.save()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

def main():
    application = webapp.WSGIApplication([
        ('/me/youtube_username', YouTubeUserNameHandler),
        ('/me/profile', ProfileHandler),
        ('/me/activities', ActivitiesHandler),
        ('/me/followings/(.*)', FollowingsHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
