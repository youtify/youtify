from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import FlattrClick
from model import Activity
from model import get_youtify_user_struct

class Handler(webapp.RequestHandler):

    def get(self, page):
        count = 0
        page_size = 30
        clicks = FlattrClick.all().fetch(page_size, page_size * int(page))

        for click in clicks:
            #if click.migrated:
                #continue

            target = simplejson.dumps({
                'thing_id': click.thing_id,
                'thing_title': click.thing_title,
            })
            actor = simplejson.dumps(get_youtify_user_struct(click.youtify_user, include_relations=False))

            m = Activity(timestamp=click.date, owner=click.youtify_user, verb='flattr', actor=actor, target=target)
            m.put()

            click.migrated = True
            click.save()

            count += 1
        
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('Migrated page %s (%s flattr clicks)' % (page, count))

def main():
    application = webapp.WSGIApplication([
        ('/migrate_flattr_activities/(.*)', Handler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
