import webapp2
import json

_cache = {}

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

def _get_translations_from_cache_or_file():
    global _cache
    
    if _cache:
        return _cache
        
    f = open('translations.json', 'r')
    
    _cache = json.loads(f.read())
    
    f.close()
    
    return _cache

def get_translations_for_lang(lang_code):
    data = _get_translations_from_cache_or_file()
    return data.get(lang_code, {}).get('translations', {})

def get_languages():
    ret = []
    data = _get_translations_from_cache_or_file()

    for lang_code in data.keys():
        ret.append({
            'code': lang_code,
            'label': data[lang_code]['label'],
        })

    return ret

class Handler(webapp2.RequestHandler):

    def get(self, lang_code):
        data = get_translations_for_lang(lang_code)
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(data))

app = webapp2.WSGIApplication([
        ('/happytranslate/(.*)', Handler),
    ], debug=True)
