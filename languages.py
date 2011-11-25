# -*- coding: utf-8 -*-

from django.conf.global_settings import LANGUAGES
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import users
from django.utils import simplejson
from model import get_current_youtify_user

languages = []
for lang in LANGUAGES:
    languages.append({
        'code': lang[0],
        'label': lang[1],
        'enabled_in_tool': True,
    })

class Language(db.Model):
    date = db.DateTimeProperty(auto_now_add=True)
    code = db.StringProperty()
    label = db.StringProperty()
    enabled_on_site = db.BooleanProperty()
    enabled_in_tool = db.BooleanProperty()

class LanguagesHandler(webapp.RequestHandler):
    def get(self):
        json = []
        for lang in Language().all().order('-date'):
            json.append({
                'id': lang.key().id(),
                'code': lang.code,
                'label': lang.label,
                'enabled_in_tool': lang.enabled_in_tool,
                'enabled_on_site': lang.enabled_on_site,
            })
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

    def post(self):
        """Create a new language"""
        if not users.is_current_user_admin():
            self.error(403)

        code = self.request.get('code')
        label = self.request.get('label')

        language = Language.all().filter('code =', code).get()
        if language is not None:
            self.error(500)
        else:
            language = Language(code=code, label=label, enabled_in_tool=False, enabled_on_site=False)
            language.put()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('')

class SpecificLanguageHandler(webapp.RequestHandler):
    def post(self):
        """Update a specific language"""
        if not users.is_current_user_admin():
            self.error(403)

        language_id = self.request.path.split('/')[-1]
        language = Language.get_by_id(int(language_id))

        if language:
            language.enabled_in_tool = self.request.get('enabled_in_tool') == 'true'
            language.enabled_on_site = self.request.get('enabled_on_site') == 'true'

            language.save()

            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('success');
        else:
            self.error(404)

    def delete(self):
        """Delete a specific language"""
        if not users.is_current_user_admin():
            self.error(403)

        language_id = self.request.path.split('/')[-1]
        language = Language.get_by_id(int(language_id))

        if language:
            language.delete()
            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('success');
        else:
            self.error(404)

class ImportHandler(webapp.RequestHandler):
    def get(self):
        for lang in LANGUAGES:
            m = Language.all().filter('code =', lang[0]).get()
            if m is not None:
                m = Language(code=lang[0], label=lang[1], enabled_on_site=False, enabled_in_tool=True)
                m.put()
        self.redirect('/languages')

def main():
    application = webapp.WSGIApplication([
        ('/languages/import', ImportHandler),
        ('/languages/.*', SpecificLanguageHandler),
        ('/languages', LanguagesHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
