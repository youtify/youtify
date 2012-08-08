import os
import random
import re
from datetime import datetime
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import util
from django.utils import simplejson
from flattr_toplist import get_flattr_toplist_json
from model import get_current_youtify_user_model
from model import create_youtify_user_model
from model import get_youtify_user_struct
from model import get_followers_for_youtify_user_model
from model import get_followings_for_youtify_user_model
from model import get_playlist_structs_for_youtify_user_model
from model import get_settings_struct_for_youtify_user_model
from languages import auto_detect_language
from snapshots import get_deployed_translations_json
from languages import get_languages
from config import ON_PRODUCTION

class NotFoundHandler(webapp.RequestHandler):

    def get(self):
        self.response.set_status(404)
        self.response.out.write("404 Not found")

class MainHandler(webapp.RequestHandler):

    def get(self):
        current_user = users.get_current_user()
        youtify_user_model = get_current_youtify_user_model()
        youtify_user_struct = None
        playlists_struct = []
        my_followers_struct = []
        my_followings_struct = []
        settings_struct = {}

        if (current_user is not None) and (youtify_user_model is None):
            youtify_user_model = create_youtify_user_model()

        if youtify_user_model is not None:
            youtify_user_model.device = str(random.random())
            youtify_user_model.last_login = datetime.now()

            # https://developers.google.com/appengine/docs/python/runtime#Request_Headers
            youtify_user_model.country = self.request.headers.get('X-AppEngine-Country', None)
            youtify_user_model.reqion = self.request.headers.get('X-AppEngine-Region', None)
            youtify_user_model.city = self.request.headers.get('X-AppEngine-City', None)
            youtify_user_model.latlon = self.request.headers.get('X-AppEngine-CityLatLong', None)

            youtify_user_model.save()

            youtify_user_struct = get_youtify_user_struct(youtify_user_model, include_private_data=True)
            playlists_struct = get_playlist_structs_for_youtify_user_model(youtify_user_model, include_private_playlists=True)
            my_followers_struct = get_followers_for_youtify_user_model(youtify_user_model)
            my_followings_struct = get_followings_for_youtify_user_model(youtify_user_model)
            settings_struct = get_settings_struct_for_youtify_user_model(youtify_user_model)
        
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
            'my_user_id': youtify_user_model is not None and youtify_user_model.key().id(),
            'device': youtify_user_model is not None and youtify_user_model.device,
            'USER': simplejson.dumps(youtify_user_struct),
            'playlistsFromServer': simplejson.dumps(playlists_struct),
            'myFollowers': simplejson.dumps(my_followers_struct),
            'myFollowings': simplejson.dumps(my_followings_struct),
            'settingsFromServer': simplejson.dumps(settings_struct),
            'autoDetectedLanguageByServer': lang,
            'autoDetectedTranslations': get_deployed_translations_json(lang),
            'logged_in': int(current_user is not None),
            'has_flattr_access_token': int(youtify_user_model is not None and youtify_user_model.flattr_access_token is not None),
            'flattr_user_name': youtify_user_model is not None and youtify_user_model.flattr_user_name,
            'login_url': users.create_login_url('/'),
            'logout_url': users.create_logout_url('/'),
            'flattrTopList': get_flattr_toplist_json(),
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
        ('/.*\.(?:png|ico|jpg|gif|xml|css|swf|js|yaml|py|pyc|woff|eot|svg|ttf)$', NotFoundHandler),
        ('/.*', MainHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
