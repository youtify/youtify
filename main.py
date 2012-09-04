import os
import re
from datetime import datetime
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import util
from django.utils import simplejson
from model import get_current_youtify_user_model
from model import create_youtify_user_model
from model import get_youtify_user_struct
from model import get_followers_for_youtify_user_model
from model import get_followings_for_youtify_user_model
from model import get_settings_struct_for_youtify_user_model
from model import generate_device_token
from languages import auto_detect_language
from snapshots import get_deployed_translations_struct
from languages import get_languages
try:
    import config
except ImportError:
    import config_template as config

class NotFoundHandler(webapp.RequestHandler):

    def get(self):
        self.response.set_status(404)
        self.response.out.write("404 Not found")

class MainHandler(webapp.RequestHandler):

    def get(self):
        # Find videotag and generate open graph meta tags
        match = re.compile(r'tracks/youtube/(.*)').search(self.request.url)
        if match: 
            og_tag = '<meta property="og:video" content="http://www.youtube.com/v/' + match.groups()[0] + '?version=3&amp;autohide=1"/><meta property="og:video:type" content="application/x-shockwave-flash"/><meta property="og:video:width" content="396"/><meta property="og:video:height" content="297"/>'
        else:
            og_tag = ''

        # TODO add og_tag for SoundCloud & Official.fm tracks

        path = os.path.join(os.path.dirname(__file__), 'html', 'index.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8';
        self.response.out.write(template.render(path, {
            'CURRENT_VERSION_ID': os.environ['CURRENT_VERSION_ID'],
            'USE_PRODUCTION_JAVASCRIPT': config.ON_PRODUCTION,
            'INCLUDE_GOOGLE_ANALYTICS': config.ON_PRODUCTION,
			'url': self.request.url,
            'og_tag': og_tag,
        }))

class ApiMainHandler(webapp.RequestHandler):

    def get(self):
        my_followers_struct = []
        my_followings_struct = []
        settings_struct = {}
        youtify_user_struct = None

        current_user = users.get_current_user()
        youtify_user_model = get_current_youtify_user_model()

        if (current_user is not None) and (youtify_user_model is None):
            youtify_user_model = create_youtify_user_model()

        if youtify_user_model is not None:
            youtify_user_model.device = generate_device_token()
            youtify_user_model.last_login = datetime.now()
            youtify_user_struct = get_youtify_user_struct(youtify_user_model, include_private_data=True)

            # https://developers.google.com/appengine/docs/python/runtime#Request_Headers
            youtify_user_model.country = self.request.headers.get('X-AppEngine-Country', None)
            youtify_user_model.reqion = self.request.headers.get('X-AppEngine-Region', None)
            youtify_user_model.city = self.request.headers.get('X-AppEngine-City', None)
            youtify_user_model.latlon = self.request.headers.get('X-AppEngine-CityLatLong', None)

            youtify_user_model.save()

            my_followers_struct = get_followers_for_youtify_user_model(youtify_user_model)
            my_followings_struct = get_followings_for_youtify_user_model(youtify_user_model)
            settings_struct = get_settings_struct_for_youtify_user_model(youtify_user_model)

        lang_code = auto_detect_language(self.request)

        json = {
            'ON_PRODUCTION': config.ON_PRODUCTION,
            'SEARCH_STATS_URL': config.SEARCH_STATS_URL,
            'languagesFromServer': [lang for lang in get_languages() if lang['enabled_on_site']],
            'device': youtify_user_model is not None and youtify_user_model.device,
            'user': youtify_user_struct,
            'lastNotificationSeenTimestamp': youtify_user_model is not None and youtify_user_model.last_notification_seen_timestamp, 
            'myFollowers': my_followers_struct,
            'myFollowings': my_followings_struct,
            'settingsFromServer': settings_struct,
            'autoDetectedLanguageByServer': lang_code,
            'autoDetectedTranslations': get_deployed_translations_struct(lang_code),
            'loginUrl': users.create_login_url('/'),
            'logoutUrl': users.create_logout_url('/'),
        }

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json));

def main():
    application = webapp.WSGIApplication([
        ('/api/main', ApiMainHandler),
        ('/.*\.(?:png|ico|jpg|gif|xml|css|swf|js|yaml|py|pyc|woff|eot|svg|ttf)$', NotFoundHandler),
        ('/.*', MainHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
