from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from model import get_current_youtify_user
from model import get_current_user_json

class ProfileHandler(webapp.RequestHandler):
    def get(self):
        user = get_current_youtify_user()
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(get_current_user_json())

    def post(self):
        user = get_current_youtify_user()

        nickname = self.request.get('nickname', user.nickname)
        gravatar_email = self.request.get('gravatar_email', user.gravatar_email)
        first_name = self.request.get('first_name', user.first_name)
        last_name = self.request.get('last_name', user.first_name)
        tagline = self.request.get('tagline', user.tagline)

        user.nickname = nickname
        user.gravatar_email = gravatar_email
        user.first_name = first_name
        user.last_name = last_name
        user.tagline = tagline

        user.save()

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
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
