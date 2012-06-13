from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
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

class MigrationStepHandler(webapp.RequestHandler):

    def get(self):
        page = int(self.request.get('page', '0'))
        page_size = 30
        count = 0

        #### START MIGRATION CODE ####

        for m in YoutifyUser.all().filter('flattr_access_token !=', None).fetch(page_size, page_size * page):
            count += 1
            m.nr_of_flattrs = len([i for i in Activity.all().filter('owner =', m).filter('verb =', 'flattr').filter('type =', 'outgoing')])
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
        ('/admin/migrations/nr_of_flattrs', MigrationStepHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
