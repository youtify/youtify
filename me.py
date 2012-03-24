from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from model import get_current_youtify_user
from model import get_current_user_json
from model import YoutifyUser

class ProfileHandler(webapp.RequestHandler):
    def get(self):
        user = get_current_youtify_user()
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(get_current_user_json())

    def post(self):
        user = get_current_youtify_user()

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
        self.response.out.write('ok')

class FollowingsHandler(webapp.RequestHandler):

    def post(self):
        uid = self.request.get('uid')
        other_user = YoutifyUser.get_by_id(int(uid))
        me = get_current_youtify_user()

        if other_user is None:
            self.error(400)
            self.response.out.write('Other user not found')
            return

        if me.key().id() == other_user.key().id():
            self.error(400)
            self.response.out.write('You can not follow yourself')
            return

        if other_user.key() in me.followings:
            self.error(400)
            self.response.out.write('You already follow that user')
            return

        # There's currently a bug in the following two lines. After
        # other_user.save(), the other_user gets the same google_user
        # as "me". Have no clue why.
        other_user.followers.append(me.key())
        other_user.put()

        me.followings.append(other_user.key())
        me.put()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

class YouTubeUserNameHandler(webapp.RequestHandler):
    def get(self):
        user = get_current_youtify_user()
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(user.youtube_username)

    def post(self):
        username = self.request.get('username')

        user = get_current_youtify_user()
        user.youtube_username = username 
        user.save()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

def main():
    application = webapp.WSGIApplication([
        ('/me/youtube_username', YouTubeUserNameHandler),
        ('/me/profile', ProfileHandler),
        ('/me/followings', FollowingsHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
