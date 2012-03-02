from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from model import get_current_youtify_user

class GravatarEmailHandler(webapp.RequestHandler):
    def get(self):
        user = get_current_youtify_user()
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(user.gravatar_email)

    def post(self):
        gravatar_email = self.request.get('gravatar_email')

        user = get_current_youtify_user()
        user.gravatar_email = gravatar_email
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
        ('/me/gravatar_email', GravatarEmailHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
