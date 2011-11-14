# -*- coding: utf-8 -*-

import os
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import users
from django.utils import simplejson
from model import get_current_youtify_user
from model import create_youtify_user
from model import YoutifyUser

class Leader(db.Model):
    lang = db.StringProperty(required=True)
    user = db.ReferenceProperty(reference_class=YoutifyUser)

class Phrase(db.Model):
    original = db.StringProperty(required=True)
    approved_translations = db.StringListProperty()

    en_US = db.StringProperty()
    sv_SE = db.StringProperty()
    ro_SE = db.StringProperty()
    fi_FI = db.StringProperty()

class HistoryItem(db.Model):
    TYPE_COMMENT = 1
    TYPE_SUGGESTION = 2
    TYPE_APPROVED = 3
    TYPE_ORIGINAL_CHANGED = 3

    phrase = db.ReferenceProperty(reference_class=Phrase)
    user = db.ReferenceProperty(reference_class=YoutifyUser)
    date = db.DateTimeProperty(auto_now_add=True)
    type = db.IntegerProperty(required=True)
    text = db.StringProperty()
    lang = db.StringProperty()

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

LANG_CODES = [i['code'] for i in languages]

# This map is used when detecting the user agents locale settings.
LANG_MAP = {}
for lang in languages:
    LANG_MAP[lang['code'].lower().replace('_', '-')] = lang['code']
    LANG_MAP[lang['code'].split('_')[0]] = lang['code']

def auto_detect_language(request):
    header = request.headers.get('Accept-Language', '')
    header = header.lower()

    accepted_languages = header.split(';')[0]
    accepted_languages = accepted_languages.split(',')

    for lang in accepted_languages:
        if lang in LANG_MAP:
            return LANG_MAP[lang]

    return 'en_US'

def get_history(phrase, code):
    json = []
    items = HistoryItem.all().filter('phrase =', phrase).filter('lang =', code)
    if items is not None:
        for item in items:
            json.append({
                'date': item.date.strftime('%Y-%M-%d %H:%m'),
                'type': item.type,
                'text': item.text,
                'user': {
                    'name': item.user.google_user.nickname().split('@')[0],
                    'id': int(item.user.key().id()),
                },
            })
    return json

def get_translations(code):
    json = []
    for phrase in Phrase.all():
        json.append({
            'id': phrase.key().id(),
            'approved': code in phrase.approved_translations,
            'original': phrase.original,
            'translation': getattr(phrase, code, phrase.original),
            'history': get_history(phrase, code),
        })
    return json

def get_translations_json_for(code):
    result = get_translations(code)
    return simplejson.dumps(result)

class TranslationsHandler(webapp.RequestHandler):
    def get(self):
        code = self.request.path.split('/')[-1]

        if not code in LANG_CODES:
            raise Exception('Unknown language code "%s"' % code)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(get_translations_json_for(code))

    def post(self):
        if not users.is_current_user_admin():
            raise Exception('Permission denied')

        lang_code = self.request.path.split('/')[-1]
        original = self.request.get('original')
        translation = self.request.get('translation')

        if not lang_code in LANG_CODES:
            raise Exception('Unknown language code "%s"' % lang_code)

        phrase = Phrase.all().filter('original =', original).get()

        if phrase is None:
            raise Exception('No phrase matching "%s" found' % original)

        setattr(phrase, lang_code, translation)
        phrase.save()

class TranslationsToolHandler(webapp.RequestHandler):
    def get(self):
        current_user = users.get_current_user()
        youtify_user = get_current_youtify_user()
        if (current_user is not None) and (youtify_user is None):
            youtify_user = create_youtify_user()
        path = os.path.join(os.path.dirname(__file__), 'html', 'translations.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8'
        self.response.out.write(template.render(path, {
            'my_user_name': current_user.nickname().split('@')[0],
            'my_user_id': youtify_user.key().id(),
            'logout_url': users.create_logout_url('/'),
            'languages': languages,
        }))

class TranslationTemplateHandler(webapp.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/plain; charset=utf-8'
        self.response.out.write('hello world')

    def post(self):
        if not users.is_current_user_admin():
            raise Exception('Permission denied')
        else:
            original = self.request.get('original')
            phrase = Phrase(original=original)
            phrase.put()

class CommentsHandler(webapp.RequestHandler):
    def post(self):
        phrase_id = self.request.path.split('/')[-2]
        lang = self.request.get('lang')
        text = self.request.get('text')
        phrase = Phrase.get_by_id(int(phrase_id))

        if phrase is None:
            raise Exception("No phrase with id %s found", phrase_id)

        history_item = HistoryItem(lang=lang, text=text, type=HistoryItem.TYPE_COMMENT, phrase=phrase, user=get_current_youtify_user())
        history_item.put()

class ApproveHandler(webapp.RequestHandler):
    def post(self):
        phrase_id = self.request.path.split('/')[-2]
        lang = self.request.get('lang')
        phrase = Phrase.get_by_id(int(phrase_id))

        if phrase is None:
            raise Exception("No phrase with id %s found", phrase_id)

        user = get_current_youtify_user()
        translation = getattr(phrase, lang)
        text = None

        if lang in phrase.approved_translations:
            phrase.approved_translations.remove(lang)
            text = '%s removed the approved state for the translation "%s"' % (user.google_user.nickname(), translation)
        else:
            phrase.approved_translations.append(lang)
            text = '%s approved the translation "%s"' % (user.google_user.nickname(), translation)

        history_item = HistoryItem(lang=lang, text=text, type=HistoryItem.TYPE_APPROVED, phrase=phrase, user=user)
        history_item.put()

        phrase.save()

class SpecificLeadersHandler(webapp.RequestHandler):
    def get(self):
        lang_code = self.request.path.split('/')[-1]
        json = []
        leaders = Leader.all().filter('lang =', lang_code)
        for leader in leaders:
            json.append({
                'lang': leader.lang,
                'user': {
                    'id': int(leader.user.key().id()),
                    'name': leader.user.google_user.nickname(),
                },
            })
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

class LeadersHandler(webapp.RequestHandler):
    def post(self):
        lang = self.request.get('lang')
        user_id = self.request.get('user')
        user = YoutifyUser.get_by_id(int(user_id))

        if user is None:
            raise Exception("No user with id %s found" % user_id)

        leader = Leader(lang=lang, user=user)
        leader.put()

    def get(self):
        json = []
        leaders = Leader.all()
        for leader in leaders:
            json.append({
                'lang': leader.lang,
                'user': {
                    'id': int(leader.user.key().id()),
                    'name': leader.user.google_user.nickname(),
                },
            })
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

def main():
    application = webapp.WSGIApplication([
        ('/api/translations.*', TranslationsHandler),
        ('/translations/leaders/.*', SpecificLeadersHandler),
        ('/translations/leaders', LeadersHandler),
        ('/translations/template', TranslationTemplateHandler),
        ('/translations/.*/approve', ApproveHandler),
        ('/translations/.*/comments', CommentsHandler),
        ('/translations.*', TranslationsToolHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
