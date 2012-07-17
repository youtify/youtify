from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import urlfetch
from model import FollowRelation
from model import YoutifyUser
from model import Activity
from string import Template
from django.utils import simplejson

TEMPLATE = """
<html>
<body>
</body>
Progress: $progress
<script type="text/javascript">
setTimeout(function() { location.href = '?page=$next'; }, 100);
</script>
</html>
"""

COMPLETE = """
<html>
<body>
<h1 style="color:green">DONE, $count iterations</h1>
</body>
</html>
"""

flattr_thing_cache = {}

class MigrationStepHandler(webapp.RequestHandler):

    def get(self):
        global flattr_thing_cache
        page = int(self.request.get('page', '0'))
        page_size = 30
        count = 0

        #### START MIGRATION CODE ####

        for m in Activity.all().filter('verb =', 'flattr').fetch(page_size, page_size * page):
            count += 1
            activity_target = simplejson.loads(m.target)
            if not activity_target['thing_title']:
                thing_id = activity_target['thing_id']
                thing_title = ''

                if thing_id in flattr_thing_cache:
                    thing_title = flattr_thing_cache[thing_id]
                else:
                    url = 'https://api.flattr.com/rest/v2/things/' + activity_target['thing_id']
                    response = urlfetch.fetch(url=url, method=urlfetch.GET)
                    json = simplejson.loads(response.content)
                    thing_title = json['title']
                    flattr_thing_cache[thing_id] = thing_title

                m.target = simplejson.dumps({
                    'thing_id': activity_target['thing_id'],
                    'thing_title': thing_title,
                })
                m.save()

        #### END MIGRATION CODE ####

        self.response.headers['Content-Type'] = 'text/html'
        if (count < page_size):
            self.response.out.write(Template(COMPLETE).substitute({
                'count': count,
            }))
        else:
            self.response.out.write(Template(TEMPLATE).substitute({
                'progress': page_size * page,
                'next': page + 1,
            }))

def main():
    application = webapp.WSGIApplication([
        ('/admin/migrations/migrate_flattr_activities', MigrationStepHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
