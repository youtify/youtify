from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from model import FollowRelation
from model import YoutifyUser
from string import Template

TEMPLATE = """
<html>
<body>
</body>
Progress: $progress%
<script type="text/javascript">
setTimeout(function() { location.href = '?page=$next'; }, 100);
</script>
</html>
"""

COMPLETE = """
<html>
<body>
<h1 style="color:green">SUCCESS</h1>
</body>
</html>
"""

class RelationsMigrationStepHandler(webapp.RequestHandler):

    def get(self):
        page = int(self.request.get('page', '0'))
        page_size = 30
        total = YoutifyUser.all().count()

        ret = []
        for m in YoutifyUser.all().fetch(page_size, page_size * page):
            m.nr_of_followers = FollowRelation.all().filter('user2 =', m.key().id()).count()
            m.nr_of_followings = FollowRelation.all().filter('user1 =', m.key().id()).count()
            m.put()

        self.response.headers['Content-Type'] = 'text/html'
        if (page_size * page) >= total:
            self.response.out.write(COMPLETE)
        else:
            progress = page * page_size
            progress = float(page) / float(page_size)
            progress = progress * 100
            progress = int(progress)
            self.response.out.write(Template(TEMPLATE).substitute({
                'progress': progress,
                'next': page + 1,
            }))

def main():
    application = webapp.WSGIApplication([
        ('/migrations/relations', RelationsMigrationStepHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
