import os
import webapp2
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import util

class SuckyBrowserHandler(webapp2.RequestHandler):

    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'html', 'yourbrowsersucks.html')

        self.response.out.write(template.render(path, {
            'ON_PRODUCTION': os.environ['SERVER_SOFTWARE'].startswith('Google App Engine'), # http://stackoverflow.com/questions/1916579/in-python-how-can-i-test-if-im-in-google-app-engine-sdk
        }))

class RockyDecisionHandler(webapp2.RequestHandler):

    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'html', 'yourdecisionrocks.html')

        self.response.out.write(template.render(path, {
            'ON_PRODUCTION': os.environ['SERVER_SOFTWARE'].startswith('Google App Engine'), # http://stackoverflow.com/questions/1916579/in-python-how-can-i-test-if-im-in-google-app-engine-sdk
        }))

app = webapp2.WSGIApplication([
        ('/yourbrowsersucks', SuckyBrowserHandler),
        ('/yourdecisionrocks', RockyDecisionHandler),
    ], debug=False)
