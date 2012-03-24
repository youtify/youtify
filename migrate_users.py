from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from model import YoutifyUser
from model import get_youtify_user_struct
from model import migrate_playlists_for_youtify_user_model
from django.utils import simplejson

class MigrateUser(webapp.RequestHandler):

    def get(self, page):
        """Get users as JSON"""
        page_size = 10
        users = YoutifyUser.all().fetch(page_size, page_size * int(page))
        
        json = {
            'total_users': YoutifyUser.all().count(),
            'migrated_users': YoutifyUser.all().filter('migrated_playlists = ', True).count(),
            'users': []
        }
        for user in users:
            if user.migrated_playlists is not True:
                json['users'].append(get_youtify_user_struct(user))
        
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

    def post(self, id):
        """Update user"""
        user = YoutifyUser.get_by_id(int(id))
        
        if user is None:
            self.error(404)
            return
        
        migrate_playlists_for_youtify_user_model(user)
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

def main():
    application = webapp.WSGIApplication([
        ('/api/migrate_users/(.*)', MigrateUser),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
