# -*- coding: utf-8 -*-

import os
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import users
from django.utils import simplejson
from model import get_current_youtify_user

class Phrase(db.Model):
    original = db.StringProperty(required=True)
    en_US = db.StringProperty()
    sv_SE = db.StringProperty()
    ro_SE = db.StringProperty()
    fi_FI = db.StringProperty()

languages = [
    {
        'code': 'en_US',
        'label': 'English',
    },
    {
        'code': 'sv_SE',
        'label': 'Svenska',
    },
    {
        'code': 'ro_SE',
        'label': 'Rövarspråket',
    },
    {
        'code': 'fi_FI',
        'label': 'Suomi',
    },
]

enabled_languages = ['en_US', 'sv_SE', 'ro_SE', 'fi_FI']

def auto_detect_language(request):
    lang_map = {
        'en-us': 'en_US',
        'en': 'en_US',
        'sv': 'sv_SE',
        'fi': 'fi_FI',
        'fi-fi': 'fi_FI',
    }

    header = request.headers.get('Accept-Language', '')
    header = header.lower()

    accepted_languages = header.split(';')[0]
    accepted_languages = accepted_languages.split(',')

    for lang in accepted_languages:
        if lang in lang_map:
            return lang_map[lang]

    return 'en_US'

def get_translations(code):
    json = {}
    for phrase in Phrase.all():
        json[phrase.original] = getattr(phrase, code, phrase.original)
    return json

def get_translations_json_for(code):
    result = get_translations(code)
    return simplejson.dumps(result)

class TranslationsHandler(webapp.RequestHandler):
    def get(self):
        code = self.request.path.split('/')[-1]

        if not code in enabled_languages:
            raise Exception('Unknown language code "%s"' % code)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(get_translations_json_for(code))

    def post(self):
        if not users.is_current_user_admin():
            raise Exception('Permission denied')

        lang_code = self.request.path.split('/')[-1]
        original = self.request.get('original')
        translation = self.request.get('translation')

        if not lang_code in enabled_languages:
            raise Exception('Unknown language code "%s"' % lang_code)

        phrase = Phrase.all().filter('original =', original).get()

        if phrase is None:
            raise Exception('No phrase matching "%s" found' % original)

        setattr(phrase, lang_code, translation)
        phrase.save()

class TranslationsToolHandler(webapp.RequestHandler):
    def get(self):
        user = get_current_youtify_user()
        path = os.path.join(os.path.dirname(__file__), 'html', 'translations.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8';
        self.response.out.write(template.render(path, {
            'name': user.google_user.nickname(),
            'logout_url': users.create_logout_url('/'),
            'languages': languages,
        }))

class TranslationTemplateHandler(webapp.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/plain; charset=utf-8';
        self.response.out.write('hello world')

    def post(self):
        if not users.is_current_user_admin():
            raise Exception('Permission denied')
        else:
            original = self.request.get('original')
            phrase = Phrase(original=original)
            phrase.put()

def main():
    application = webapp.WSGIApplication([
        ('/api/translations.*', TranslationsHandler),
        ('/translations/template', TranslationTemplateHandler),
        ('/translations.*', TranslationsToolHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
