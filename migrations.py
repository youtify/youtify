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
<h1 style="color:green">DONE</h1>
</body>
</html>
"""

class RelationsMigrationStepHandler(webapp.RequestHandler):

    def get(self):
        page = int(self.request.get('page', '0'))
        page_size = 30

        ret = []
        count = 0
        for m in YoutifyUser.all().fetch(page_size, page_size * page):
            count += 1
            m.nr_of_followers = FollowRelation.all().filter('user2 =', m.key().id()).count()
            m.nr_of_followings = FollowRelation.all().filter('user1 =', m.key().id()).count()
            m.save()

        self.response.headers['Content-Type'] = 'text/html'
        if (count < page_size):
            self.response.out.write(COMPLETE)
        else:
            self.response.out.write(Template(TEMPLATE).substitute({
                'progress': page_size * page,
                'next': page + 1,
            }))

class ActivitiesMigrationStepHandler(webapp.RequestHandler):

    def get(self):
        page = int(self.request.get('page', '0'))
        page_size = 30

        ret = []
        count = 0
        for m in Activity.all().fetch(page_size, page_size * page):
            count += 1

            user = simplejson.loads(m.actor)
            if str(user['id']) != str(m.owner.key().id()):
                m.type = 'incoming'
            else:
                m.type = 'outgoing'
            m.save()

        self.response.headers['Content-Type'] = 'text/html'
        if (count < page_size):
            self.response.out.write(COMPLETE)
        else:
            self.response.out.write(Template(TEMPLATE).substitute({
                'progress': page_size * page,
                'next': page + 1,
            }))

def main():
    application = webapp.WSGIApplication([
        ('/admin/migrations/relations', RelationsMigrationStepHandler),
        ('/admin/migrations/activities', ActivitiesMigrationStepHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
