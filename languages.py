# -*- coding: utf-8 -*-

import logging
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import users
from django.utils import simplejson
from model import get_current_youtify_user
from model import YoutifyUser
from model import Language
from model import Translation
from model import Phrase

languages = []
lang_codes = []
lang_map = {}

def init_cached_languages():
    """This method initializes the app cached translations"""
    global languages, lang_codes, lang_map

    del languages[:]
    del lang_codes[:]
    lang_map.clear()

    for lang in Language.all().order('-date'):
        logging.info("Generating cache for language %s" % lang.code)
        languages.append({
            'id': lang.key().id(),
            'code': lang.code,
            'label': lang.label,
            'enabled_in_tool': lang.enabled_in_tool,
            'enabled_on_site': lang.enabled_on_site,
        })

    lang_codes = [i['code'] for i in languages]

    for lang in languages:
        lang_map[lang['code'].lower().replace('_', '-')] = lang['code']
        lang_map[lang['code'].split('_')[0]] = lang['code']

def get_translations(code):
    json = []
    for translation in Translation.all().filter('code =', code):
        json.append({
            'id': translation.key().id(),
            'original': translation.phrase.text,
            'translation': translation.text,
        })
    return json

def get_languages():
    global languages
    logging.info(languages)
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

class LeadersHandler(webapp.RequestHandler):
    def get(self):
        lang_code = self.request.path.split('/')[-2]
        language = Language.all().filter('code =', lang_code).get()

        if language is None:
            self.error(404)

        json = []

        for key in language.leaders:
            user = db.get(key)
            json.append({
                'id': user.key().id(),
                'name': user.google_user.nickname(),
                'email': user.google_user.email(),
            })

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

    def post(self):
        """Add a new leader for this language"""
        lang_code = self.request.path.split('/')[-2]
        language = Language.all().filter('code =', lang_code).get()
        user_id = self.request.get('user')

        if language is None:
            self.error(404)

        if user_id is None:
            self.error(400)

        user = YoutifyUser.get_by_id(int(user_id))
        
        if user.key() not in language.leaders:
            language.leaders.append(user.key())
            language.save()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('success')

    def delete(self):
        """Remove a user from the list of leaders"""
        lang_code = self.request.path.split('/')[-3]
        user_id = self.request.path.split('/')[-1]
        language = Language.all().filter('code =', lang_code).get()
        user = YoutifyUser.get_by_id(int(user_id))

        if language is None:
            self.error(404)

        if user is None:
            self.error(404)
        
        language.leaders.remove(user.key())
        language.save()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('success')

class LanguagesHandler(webapp.RequestHandler):
    def get(self):
        """Returns the list of languages"""
        global languages
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(languages))

    def post(self):
        """Create a new language and fill it with empty translations"""
        if not users.is_current_user_admin():
            self.error(403)

        code = self.request.get('code')
        label = self.request.get('label')

        language = Language.all().filter('code =', code).get()
        if language is not None:
            self.error(500)
        else:
            language = Language(code=code, label=label, enabled_in_tool=False, enabled_on_site=False)
            for phrase in Phrase.all():
                translation = Translation(phrase=phrase, text='')
                translation.put()
                language.translations.append(translation.key())
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

class TranslationsHandler(webapp.RequestHandler):
    def get(self):
        """Get all translations for a specific language"""
        lang_code = self.request.path.split('/')[-2]
        language = Language.all().filter('code =', lang_code).get()

        if language is None:
            self.error(404)

        json = []
        translations = db.get(language.translations)
        for translation in translations:
            json.append({
                'id': translation.key().id(),
                'original': translation.phrase.text,
                'translation': translation.text,
            })

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

    def post(self):
        """Post new suggestion"""
        lang_code = self.request.path.split('/')[-3]
        language = Language.all().filter('code =', lang_code).get()

        if language is None:
            self.error(404)

        user = get_current_youtify_user()

        if not (users.is_current_user_admin() or user.key() in language.leaders):
            self.error(403)

        translation_id = self.request.path.split('/')[-1]
        translation = Translation.get_by_id(int(translation_id))

        if translation is None:
            self.error(404)

        translation.text = self.request.get('text')
        translation.save()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('success')

init_cached_languages()

def get_leader_langs_for_user(youtify_user):
    ret = []
    for language in Language.all():
        if youtify_user.key() in language.leaders:
            ret.append(language.code)
    return ret

def main():
    application = webapp.WSGIApplication([
        ('/languages/.*?/leaders.*', LeadersHandler),
        ('/languages/.*?/translations.*', TranslationsHandler),
        ('/languages/.*', SpecificLanguageHandler),
        ('/languages', LanguagesHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
