from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from model import Playlist
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
<h1 color="green">SUCCESS</h1>
</body>
</html>
"""

class UsersHandler(webapp.RequestHandler):

    def get(self):
        page = int(self.request.get('page', '0'))
        page_size = 30
        total = YoutifyUser.all().count()

        ret = []
        for m in YoutifyUser.all().fetch(page_size, page_size * page):
            m.put()

        self.response.headers['Content-Type'] = 'text/html'
        if (page_size * page) >= total:
            self.response.out.write(COMPLETE)
        else:
            self.response.out.write(Template(TEMPLATE).substitute({
                'progress': (page * page_size)/total,
                'next': page + 1,
            }))

class PlaylistsHandler(webapp.RequestHandler):

    def get(self):
        page = int(self.request.get('page', '0'))
        page_size = 30
        total = Playlist.all().count()

        ret = []
        for m in Playlist.all().fetch(page_size, page_size * page):
            m.put()

        self.response.headers['Content-Type'] = 'text/html'
        if (page_size * page) >= total:
            self.response.out.write(COMPLETE)
        else:
            self.response.out.write(Template(TEMPLATE).substitute({
                'progress': (page * page_size)/total,
                'next': page + 1,
            }))

def main():
    application = webapp.WSGIApplication([
        ('/migrations/users', UsersHandler),
        ('/migrations/playlists', PlaylistsHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
