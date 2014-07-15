import webapp2
from google.appengine.ext.webapp import util
from google.appengine.api import urlfetch
from model import FollowRelation
from model import YoutifyUser
from model import Activity
from model import Playlist
from model import ExternalUser
from string import Template
import json as simplejson
from datetime import datetime

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


class MigrationStepHandler(webapp2.RequestHandler):

    def get(self):
        page = int(self.request.get('page', '0'))
        page_size = 30
        count = 0

        #### START MIGRATION CODE ####

        for m in ExternalUser.all().fetch(page_size, page_size * page):
            count += 1
            m.last_checked = datetime.now()
            if m.nr_of_subscribers > 0:
                m.get_last_updated = True
            else:
                m.get_last_updated = False
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

app = webapp2.WSGIApplication([
        ('/admin/migrations/set_last_checked', MigrationStepHandler),
    ], debug=False)
