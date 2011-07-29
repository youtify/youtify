# -*- coding: utf-8 -*-

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import users
from django.utils import simplejson
from model import Phrase
from model import Translation
from model import get_current_youtify_user

translations = {}

translations['en_US'] = {
	'Uploader:': u'Uploader: ',
	'Related:': u'Related: ',
	'Top 100': u'Top 100',
	'Best of YouTube': u'Best of YouTube',
	'Play Queue': u'Play Queue',
	'Search Results': u'Search Results',
	'New playlist...': u'New playlist...',
	'Search': u'Search',
	'Videos': u'Videos',
	'Playlists': u'Playlists',
	'Toggle fullscreen': u'Toggle fullscreen',
	'Settings': u'Settings',
	'Language': u'Language',
	'Themes': u'Themes',
	'Choose theme': u'Choose theme',
	'Quality': u'Quality',
	'Low': u'Low',
	'High': u'High',
	'Quality (Sound & Video)': u'Quality (Sound & Video)',
	'Flattr us!': u'Flattr us!',
	'Follow us on Twitter!': u'Follow us on Twitter!',
	'Like us on Facebook!': u'Like us on Facebook!',
	'Legal & Information': u'Legal & Information',
	'Legal disclaimer': u'Legal disclaimer',
	'Our blog': u'Our blog',
	'Youtify on GitHub': u'Youtify on GitHub',
	'How to import from Spotify': u'How to import from Spotify',
	'Notifications': u'Notifications',
	'Hide after %s seconds:': u'Hide after:',
	'seconds': u'seconds',
	'Instructions': u'Instructions',
}

translations['sv_SE'] = {
	'Uploader:': u'Uppladdare: ',
	'Related:': u'Relaterat: ',
	'Top 100': u'Topp 100',
	'Best of YouTube': u'YouTubes bästa',
	'Play Queue': u'Spellista',
	'Search Results': u'Sökresultat',
	'New playlist...': u'Ny spellista...',
	'Search': u'Sök',
	'Videos': u'Videos',
	'Playlists': u'Spellistor',
	'Toggle fullscreen': u'Växla fullskärm',
	'Settings': u'Inställningar',
	'Language': u'Språk',
	'Themes': u'Tema',
	'Choose theme': u'Välj tema',
	'Quality': u'Kvalitet',
	'Low': u'Låg',
	'High': u'Hög',
	'Quality (Sound & Video)': u'Kvalitet (ljud & bild)',
	'Flattr us!': u'Flattra oss!',
	'Follow us on Twitter!': u'Följ oss på Twitter!',
	'Like us on Facebook!': u'Gilla oss på Facebook!',
	'Legal & Information': u'Rättsligt & Information',
	'Legal disclaimer': u'Juridisk ansvarsbegränsning',
	'Our blog': u'Vår blogg',
	'Youtify on GitHub': u'Youtify på GitHub',
	'How to import from Spotify': u'Hur man importerar från Spotify',
	'Notifications': u'Meddelande',
	'Hide after:': u'Göm efter:',
	'seconds': u'sekunder',
	'Instructions': u'Instruktioner',
}

translations['fi_FI'] = {
	'Uploader:': u'Lähettäjä: ',
	'Related:': u'Samankaltaista: ',
	'Top 100': u'Top 100',
	'Best of YouTube': u'YouTuben parhaat',
	'Play Queue': u'Soittojono',
	'Search Results': u'Hakutulokset',
	'New playlist...': u'Uusi soittolista...',
	'Search': u'Haku',
	'Videos': u'Videot',
	'Playlists': u'Soittolistat',
	'Toggle fullscreen': u'Vaihda kokoruututila',
	'Settings': u'Asetukset',
	'Language': u'Kieli',
	'Themes': u'Teemat',
	'Choose theme': u'Valitse teema',
	'Quality': u'Laatu',
	'Low': u'Alhainen',
	'High': u'Korkea',
	'Quality (Sound & Video)': u'Laatu (Ääni & Video)',
	'Flattr us!': u'Flattr meitä!',
	'Follow us on Twitter!': u'Seuraa meitä Twitterissä!',
	'Like us on Facebook!': u'Tykkää meistä Facebookissa!',
	'Legal & Information': u'Laillisuus & Tiedot',
	'Legal disclaimer': u'Laillinen vastuunvapauslauseke',
	'Our blog': u'Meidän blogimme',
	'Youtify on GitHub': u'Youtify GitHubissa',
	'How to import from Spotify': u'Kuinka tuoda Spotifystä',
	'Notifications': u'Huomautukset',
	'Hide after:': u'Piilota jälkeen:',
	'seconds': u'sekuntit',
	'Instructions': u'Ohjeet',
}


class TranslationsHandler(webapp.RequestHandler):
    def get(self):
        code = self.request.path.split('/')[-1]

        if not code in translations:
            raise Exception('Unknown language code')

        result = dict(translations['en_US'].items() + translations[code].items())
        result = simplejson.dumps(result)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(result)

    def post(self):
        code = self.request.path.split('/')[-2]
        original = self.request.get('original')
        suggestion = self.request.get('suggestion')

        if not code in translations:
            raise Exception('Unknown language code')

        current_user = get_current_youtify_user()
        translation = Translation(text=suggestion, user=current_user)
        phrase = Phrase.all().filter(original=original)
        if phrase is None and users.is_current_user_admin():
            phrase = Phrase(original=original)

        suggestions = getattr(phrase, code)
        suggestions.append(suggestion)
        phrase.save()

def main():
    application = webapp.WSGIApplication([
        ('/translations.*', TranslationsHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
