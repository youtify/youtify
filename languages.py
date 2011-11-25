# -*- coding: utf-8 -*-

import logging
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import users
from django.utils import simplejson

languages = None
lang_codes = None
lang_map = None

def init_cached_languages():
    """This method initializes the app cached translations"""
    global languages, lang_codes, lang_map

    languages = []
    lang_codes = []
    lang_map = {}

    for lang in Language.all():
        languages.append({
            'code': lang.code,
            'label': lang.label,
            'enabled_in_tool': lang.enabled_in_tool,
            'enabled_on_site': lang.enabled_on_site,
        })

    lang_codes = [i['code'] for i in languages]

    for lang in languages:
        lang_map[lang['code'].lower().replace('_', '-')] = lang['code']
        lang_map[lang['code'].split('_')[0]] = lang['code']

def get_languages():
    global languages
    return languages

def get_lang_codes():
    global lang_codes
    return lang_codes

def get_lang_map():
    global lang_map
    return lang_map

def auto_detect_language(request):
    global lang_map

    header = request.headers.get('Accept-Language', '')
    header = header.lower()

    accepted_languages = header.split(';')[0]
    accepted_languages = accepted_languages.split(',')

    for lang in accepted_languages:
        if lang in lang_map:
            return lang_map[lang]

    return 'en_US'

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

        init_cached_languages()

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

            init_cached_languages()

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
            init_cached_languages()
            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('success');
        else:
            self.error(404)

def main():
    application = webapp.WSGIApplication([
        ('/languages/.*', SpecificLanguageHandler),
        ('/languages', LanguagesHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
