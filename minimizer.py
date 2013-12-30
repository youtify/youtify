import os
import webapp2
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import util

class MinimizerHandler(webapp2.RequestHandler):

    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'html', 'minimizer.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8';
        self.response.out.write(template.render(path, {
        }))

app = webapp2.WSGIApplication([
        ('/.*', MinimizerHandler),
    ], debug=False)
