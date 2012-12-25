from google.appengine.ext import db
import webapp2
from google.appengine.ext.webapp import util
from google.appengine.api import users
import json as simplejson
from model import Phrase
from model import Language
from model import Translation

class PhrasesHandler(webapp2.RequestHandler):
    def get(self):
        """Get all phrases"""
        json = []
        phrases = Phrase.all().order('-date')
        for phrase in phrases:
            json.append({
                'id': phrase.key().id(),
                'text': phrase.text,
            })
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

    def post(self):
        """Create a new phrase"""
        if not users.is_current_user_admin():
            self.error(403)
        else:
            text = self.request.get('text')
            phrase = Phrase(text=text)
            phrase.put()

            for lang in Language.all():
                translation = Translation(phrase=phrase, text='')
                translation.save()

                lang.translations.append(translation.key())
                lang.save()

    def delete(self):
        """Delete a specific phrase and all its translations"""
        if not users.is_current_user_admin():
            self.error(403)

        phrase_id = self.request.path.split('/')[-1]
        phrase = Phrase.get_by_id(int(phrase_id))

        if phrase:
            for lang in Language.all():
                for translation in db.get(lang.translations):
                    if translation.phrase.key() == phrase.key():
                        lang.translations.remove(translation.key())
                        translation.delete()
                        lang.save()

            phrase.delete()

            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('success');
        else:
            self.error(404)

app = webapp2.WSGIApplication([
        ('/phrases.*', PhrasesHandler),
    ], debug=True)
