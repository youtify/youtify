from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import FlattrClick
from model import Activity
from model import get_youtify_user_struct

class Handler(webapp.RequestHandler):

    def get(self):
        count = 0

        for click in FlattrClick.all():
            if click.migrated:
                continue

            data = simplejson.dumps({
                'thing_id': click.thing_id,
                'thing_title': click.thing_title,
            })
            user = simplejson.dumps(get_youtify_user_struct(click.youtify_user, include_relations=False))

            m = Activity(timestamp=click.date, owner=click.youtify_user, verb='flattr', user=user, data=data)
            m.put()

            click.migrated = True
            click.save()

            count += 1
        
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('Migrated %s flattr clicks' % count)

def main():
    application = webapp.WSGIApplication([
        ('/migrate_flattr_activities', Handler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
