import os
import random
import re
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import util
from django.utils import simplejson
from toplist import get_or_create_toplist_json
from model import get_current_youtify_user_model
from model import create_youtify_user_model
from model import get_youtify_user_struct
from model import get_followers_for_youtify_user_model
from model import get_followings_for_youtify_user_model
from model import get_playlist_structs_for_youtify_user_model
from languages import auto_detect_language
from snapshots import get_deployed_translations_json
from languages import get_languages
import flattr_toplist

class MainHandler(webapp.RequestHandler):

    def get(self):
        current_user = users.get_current_user()
        youtify_user_model = get_current_youtify_user_model()
        youtify_user_struct = None
        playlists_struct = []
        my_followers_struct = []
        my_followings_struct = []

        if (current_user is not None) and (youtify_user_model is None):
            youtify_user_model = create_youtify_user_model()

        if youtify_user_model is not None:
            youtify_user_model.device = str(random.random())
            youtify_user_model.save()
            youtify_user_struct = get_youtify_user_struct(youtify_user_model, include_private_data=True)
            playlists_struct = get_playlist_structs_for_youtify_user_model(youtify_user_model)
            my_followers_struct = get_followers_for_youtify_user_model(youtify_user_model)
            my_followings_struct = get_followings_for_youtify_user_model(youtify_user_model)

        ON_PRODUCTION = os.environ['SERVER_SOFTWARE'].startswith('Google App Engine') # http://stackoverflow.com/questions/1916579/in-python-how-can-i-test-if-im-in-google-app-engine-sdk
        
        # Find videotag and generate open graph meta tags
        match = re.compile(r'tracks/youtube/(.*)').search(self.request.url)
        if match: 
            og_tag = '<meta property="og:video" content="http://www.youtube.com/v/' + match.groups()[0] + '?version=3&amp;autohide=1"/><meta property="og:video:type" content="application/x-shockwave-flash"/><meta property="og:video:width" content="396"/><meta property="og:video:height" content="297"/>'
        else:
            og_tag = ''

        # TODO add og_tag for SoundCloud & Official.fm tracks

        lang = auto_detect_language(self.request)

        path = os.path.join(os.path.dirname(__file__), 'html', 'index.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8';
        self.response.out.write(template.render(path, {
            'user': current_user,
            'is_admin': int(users.is_current_user_admin()),
            'youtify_user': youtify_user_model,
            'user_args': simplejson.dumps(youtify_user_struct),
            'playlistsFromServer': simplejson.dumps(playlists_struct),
            'myFollowers': simplejson.dumps(my_followers_struct),
            'myFollowings': simplejson.dumps(my_followings_struct),
            'autoDetectedLanguageByServer': lang,
            'autoDetectedTranslations': get_deployed_translations_json(lang),
            'logged_in': int(current_user is not None),
            'has_flattr_access_token': int(youtify_user_model is not None and youtify_user_model.flattr_access_token is not None),
            'flattr_user_name': youtify_user_model is not None and youtify_user_model.flattr_user_name,
            'login_url': users.create_login_url('/'),
            'logout_url': users.create_logout_url('/'),
            'toplist': get_or_create_toplist_json(),
            'flattr_toplist': flattr_toplist.get_or_create_toplist_json(),
            'CURRENT_VERSION_ID': os.environ['CURRENT_VERSION_ID'],
            'ON_PRODUCTION': ON_PRODUCTION,
            'ON_DEV': ON_PRODUCTION is False,
            'USE_PRODUCTION_JAVASCRIPT': ON_PRODUCTION,
            'languages': [lang for lang in get_languages() if lang['enabled_on_site']],
            #'USE_PRODUCTION_JAVASCRIPT': True, # Uncomment to try out production settings. Remember to build production.js with localhost:8080/minimizer
			'url': self.request.url,
            'og_tag': og_tag,
        }))

def main():
    application = webapp.WSGIApplication([
        ('/.*', MainHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
