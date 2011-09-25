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
	'About': u'About',
	'Legal disclaimer': u'Legal disclaimer',
	'Our blog': u'Our blog',
	'Youtify on GitHub': u'Youtify on GitHub',
	'How to import from Spotify': u'How to import from Spotify',
	'Import from Spotify': u'Import from Spotify',
	'Notifications': u'Notifications',
	'Hide after %s seconds:': u'Hide after:',
	'seconds': u'seconds',
	'Instructions': u'Instructions',
	'No such playlist found': u'No such playlist found',
	'Your account has been used somewhere else. Please reload the page.': u'Your account has been used somewhere else. Please reload the page.',
	'This will delete duplicate videos from your playlist. Continue?': u'This will delete duplicate videos from your playlist. Continue?',
	' duplicates removed.': u' duplicates removed.',
	'More': u'More',
	'Less': u'Less',
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
	'About': u'Om oss',
	'Legal disclaimer': u'Juridisk ansvarsbegränsning',
	'Our blog': u'Vår blogg',
	'Youtify on GitHub': u'Youtify på GitHub',
	'How to import from Spotify': u'Hur man importerar från Spotify',
	'Import from Spotify': u'Importera från Spotify',
	'Notifications': u'Meddelande',
	'Hide after:': u'Göm efter:',
	'seconds': u'sekunder',
	'Instructions': u'Instruktioner',
	'No such playlist found': u'Kunde inte hitta spellistan',
	'Your account has been used somewhere else. Please reload the page.': u'Ditt konto har använts någon annanstans. Var god ladda om sidan.',
	'This will delete duplicate videos from your playlist. Continue?': u'Detta kommer radera dubletter från din spellista. Vill du fortsätta?',
	' duplicates removed.': u'  dubletter raderade.',
	'More': u'Mer',
	'Less': u'Mindre',
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
	'About': u'About',
	'Legal disclaimer': u'Laillinen vastuunvapauslauseke',
	'Our blog': u'Meidän blogimme',
	'Youtify on GitHub': u'Youtify GitHubissa',
	'How to import from Spotify': u'Kuinka tuoda Spotifystä',
	'Import from Spotify': u'Import from Spotifystä',
	'Notifications': u'Huomautukset',
	'Hide after:': u'Piilota ajassa:',
	'seconds': u'sekuntia',
	'Instructions': u'Ohjeet',
	'No such playlist found': u'Soittolistaa ei löytynyt',
	'Your account has been used somewhere else. Please reload the page.': u'Tunnustasi on käytetty jostakin muualta. Ole hyvä ja pävitä sivu.',
	'This will delete duplicate videos from your playlist. Continue?': u'Tämä poistaa videot, jotka ovat kaksoiskappaleita, soittolistastasi. Tahdotko jatkaa?',
	' duplicates removed.': u' kaksoiskappaleet poistettu.',
	'More': u'Lisää',
	'Less': u'Vähemmän',
}
translations['ro_SE'] = {
	'Uploader:': u'Upoppoploladoddodarore: ',
	'Related:': u'Rorelolatoteroratot: ',
	'Top 100': u'Totopoppop 100',
	'Best of YouTube': u'YouToTubobesos bobäsostota',
	'Play Queue': u'Sospopelollolisostota',
	'Search Results': u'Sosökokroresosuloltotatot',
	'New playlist...': u'Nony sospopelollolisostota...',
	'Search': u'Sosökok',
	'Videos': u'Vovidodeosos',
	'Playlists': u'Sospopelollolisostotoror',
	'Toggle fullscreen': u'Sospopelollolisostotoror',
	'Settings': u'Inonsostotälollolnoninongogaror',
	'Language': u'Sospoproråkok',
	'Themes': u'Totemoma',
	'Choose theme': u'Voväloljoj totemoma',
	'Quality': u'Kokvovalolitotetot',
	'Low': u'Lolågog',
	'High': u'Hohögog',
	'Quality (Sound & Video)': u'Kokvovalolitotetot (loljojudod & bobiloldod)',
	'Flattr us!': u'Foflolatottotrora osossos!',
	'Follow us on Twitter!': u'Foföloljoj osossos popå ToTwowitottoteror!',
	'Like us on Facebook!': u'Gogilollola osossos popå FoFacocebobookok!',
	'About': u'Omom osossos',
	'Legal disclaimer': u'Jojuroridodisoskok anonsosvovarorsosbobegogroränonsosnoninongog',
	'Our blog': u'Vovåror boblologoggog',
	'Youtify on GitHub': u'Youtotifofy popå GoGitotHoHubob',
	'How to import from Spotify': u'Hohuror momanon imompoporortoteroraror fofrorånon SoSpopototifofy',
	'Import from Spotify': u'Imompoporortoterora fofrorånon SoSpopototifofy',
	'Notifications': u'Momedoddodelolanondode',
	'Hide after:': u'Gogömom efoftoteror:',
	'seconds': u'sosekokunondoderor',
	'Instructions': u'Inonsostotrorukoktotiononeror',
	'No such playlist found': u'Kokunondode inontote hohitottota sospopelollolisostotanon',
	'Your account has been used somewhere else. Please reload the page.': u'Doditottot kokonontoto hoharor anonvovänontotsos nonågogonon anonnonanonsostotanonsos. VoVaror gogodod loladoddoda omom sosidodanon.',
	'This will delete duplicate videos from your playlist. Continue?': u'Dodetottota kokomommomeror roradoderora dodubobloletottoteror fofrorånon dodinon sospopelollolisostota. VoVilollol dodu foforortotsosätottota?',
	' duplicates removed.': u'  dodubobloletottoteror roradoderoradode.',
	'More': u'Momeror',
	'Less': u'Mominondodrore',
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
