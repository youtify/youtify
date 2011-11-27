from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import users
from django.utils import simplejson
from model import Phrase
from model import Translation

class PhrasesHandler(webapp.RequestHandler):
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

    def delete(self):
        """Delete a specific phrase and all its translations"""
        if not users.is_current_user_admin():
            self.error(403)

        phrase_id = self.request.path.split('/')[-1]
        phrase = Phrase.get_by_id(int(phrase_id))

        if phrase:
            phrase.delete()

            for translation in Translation.all().filter('phrase =', phrase):
                translation.delete()

            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('success');
        else:
            self.error(404)

def main():
    application = webapp.WSGIApplication([
        ('/phrases.*', PhrasesHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
