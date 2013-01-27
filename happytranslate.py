import logging
import webapp2
from google.appengine.api import urlfetch
from google.appengine.api import memcache
import json

# This map is used to translate the user agent provided lang code
# to the format we use for our translations.
LANG_CODE_MAP = {
    'sv': 'sv_SE',
    'fi': 'fi_FI',
    'en': 'en_US',
    'de': 'de_DE',
}

def auto_detect_language(request):
    header = request.headers.get('Accept-Language', '')
    header = header.lower()

    accepted_languages = header.split(';')[0]
    accepted_languages = accepted_languages.split(',')

    for lang in accepted_languages:
        if lang in LANG_CODE_MAP:
            return LANG_CODE_MAP[lang]

        lang = lang.split('-')[0]
        if lang in LANG_CODE_MAP:
            return LANG_CODE_MAP[lang]

    return 'en_US'

def fetch_translations():
    url = 'http://happytranslate123.appspot.com/api/youtify/export'

    try:
        response = urlfetch.fetch(url=url, method='GET', deadline=10)
        return response.content
    except:
        logging.error('Error fetching translations')
        return '{}'

def get_or_fetch_translations(lang_code):
    data = memcache.get('translations')
    if not data:
        data = fetch_translations()
        memcache.add('translations', data, 3600*24)
    data = json.loads(data)
    return data.get(lang_code, {}).get('translations', {})

def get_languages():
    translations = memcache.get('translations')

    if not translations:
        return []

    translations = json.loads(translations)
    ret = []

    for lang_code in translations.keys():
        ret.append({
            'code': lang_code,
            'label': translations[lang_code]['label'],
        })

    return ret

class Handler(webapp2.RequestHandler):

    def get(self, lang_code):
        data = get_or_fetch_translations(lang_code)
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(data))

app = webapp2.WSGIApplication([
        ('/happytranslate/(.*)', Handler),
    ], debug=True)
