from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from model import get_youtify_user_by_id_or_nick
from model import get_youtify_user_json_for

class UserHandler(webapp.RequestHandler):

    def get(self, id_or_nick):
        """Get user as JSON"""
        json = None
        user = get_youtify_user_by_id_or_nick(id_or_nick)
        
        if user is None:
            self.error(404)
            return
        
        json = get_youtify_user_json_for(user)
        
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json)

    def post(self):
        """Update user"""
        self.error(500)

def main():
    application = webapp.WSGIApplication([
        ('/api/users/(.*)', UserHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
