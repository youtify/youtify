from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import urlfetch
from model import FollowRelation
from model import YoutifyUser
from model import Activity
from model import Playlist
from model import ExternalUser
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

def import_followings(external_user_id):
    url = "http://api.soundcloud.com/users/%s/followings.json?client_id=%s" % (external_user_id, '206f38d9623048d6de0ef3a89fea1c4d')
    result = urlfetch.fetch(url)
    result = simplejson.loads(result.content)
    for user in result:
        if ExternalUser.all().filter('type =', 'soundcloud').filter('external_user_id =', str(user['id'])).get() is None:
            external_user_model = ExternalUser(type='soundcloud', external_user_id=str(user['id'])) 
            external_user_model.username = user['permalink']
            external_user_model.avatar_url = user['avatar_url']
            external_user_model.save()

class MigrationStepHandler(webapp.RequestHandler):

    def get(self):
        global flattr_thing_cache
        page = int(self.request.get('page', '0'))
        page_size = 30
        count = 0

        #### START MIGRATION CODE ####

        for m in ExternalUser.all().filter('type =', 'soundcloud').fetch(page_size, page_size * page):
            count += 1
            import_followings(m.external_user_id)

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
        ('/admin/migrations/import_followings', MigrationStepHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
