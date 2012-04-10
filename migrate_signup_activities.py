from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import YoutifyUser
from model import Activity
from model import get_youtify_user_struct

class Handler(webapp.RequestHandler):

    def get(self, page):
        """Get users as JSON"""
        count = 0
        page_size = 100
        users = YoutifyUser.all().fetch(page_size, page_size * int(page))

        for user in users:
            count += 1

            user.device = None
            user.save()

            target = simplejson.dumps({})
            actor = simplejson.dumps(get_youtify_user_struct(user, include_relations=False))
            m = Activity(timestamp=user.created, owner=user, verb='signup', actor=actor, target=target)
            m.put()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('Migrated users page %s (%i activities created)' % (page, count))

def main():
    application = webapp.WSGIApplication([
        ('/migrate_signup_activities/(.*)', Handler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
