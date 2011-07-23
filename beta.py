import os

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

class BetaHandler(webapp.RequestHandler):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'html', 'beta.html')
        self.response.out.write(template.render(path, {
        }))

def main():
    application = webapp.WSGIApplication([
        ('/beta', BetaHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
