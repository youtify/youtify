import os
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import users
from django.utils import simplejson
from model import get_current_youtify_user
from model import create_youtify_user
from languages import get_languages
from languages import get_leader_langs_for_user

class TranslationsToolHandler(webapp.RequestHandler):
    def get(self):
        current_user = users.get_current_user()
        youtify_user = get_current_youtify_user()
        if (current_user is not None) and (youtify_user is None):
            youtify_user = create_youtify_user()
        path = os.path.join(os.path.dirname(__file__), 'html', 'translations.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8'
        self.response.out.write(template.render(path, {
            'is_admin': simplejson.dumps(users.is_current_user_admin()),
            'my_langs': simplejson.dumps(get_leader_langs_for_user(youtify_user)),
            'my_user_email': current_user.email(),
            'my_user_name': current_user.nickname().split('@')[0],
            'my_user_id': youtify_user.key().id(),
            'logout_url': users.create_logout_url('/'),
            'languages': [lang for lang in get_languages() if lang['enabled_in_tool']],
        }))

def main():
    application = webapp.WSGIApplication([
        ('/translations.*', TranslationsToolHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
