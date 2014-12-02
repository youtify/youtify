import re
import logging
import webapp2
from google.appengine.ext.webapp import util
import json as simplejson
from model import get_current_youtify_user_model
from model import get_youtify_user_model_by_id_or_nick
from model import get_youtify_user_struct
from model import YoutifyUser
from model import FollowRelation
from model import get_activities_structs
from model import get_display_name_for_youtify_user_model
from model import get_external_user_subscriptions_struct_for_youtify_user_model
from model import get_settings_struct_for_youtify_user_model
from model import get_playlist_overview_structs
from model import generate_device_token
from activities import create_follow_activity
from mail import send_new_follower_email

BLOCKED_NICKNAMES = [
    'admin',
    'stats',
    'import',
    'export',
    'translations',
    'settings',
    'preferences',
    'yourbrowsersucks',
    'yourdecisionrocks',
    'me',
    'news',
    'feed',
    'newsfeed',
    'activities',
    'toplist',
    'recommendations',
    'queue',
    'search',
    'users',
    'playlists',
    'api',
    'about',
    'support',
    'faq',
]

class ProfileHandler(webapp2.RequestHandler):
    def get(self):
        user = get_current_youtify_user_model()
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(get_youtify_user_struct(get_current_youtify_user_model())))

    def post(self):
        user = get_current_youtify_user_model()
        nickname = self.request.get('nickname', user.nickname)
        first_name = self.request.get('first_name', user.first_name)
        last_name = self.request.get('last_name', user.first_name)
        tagline = self.request.get('tagline', user.tagline)

        if nickname and not re.match('^[A-Za-z0-9_]{1,36}$', nickname):
            self.error(400)
            self.response.out.write('Nickname must be 1-36 alphanumerical characters (no whitespace)')
            return

        if nickname and nickname in BLOCKED_NICKNAMES:
            self.error(400)
            self.response.out.write('That nickname is not allowed.')
            return

        for u in YoutifyUser.all().filter('nickname_lower = ', nickname.lower()):
            if str(u.key().id()) != str(user.key().id()):
                self.error(409)
                self.response.out.write('Nickname is already taken')
                return

        user.nickname = nickname
        user.nickname_lower = nickname.lower()
        user.first_name = first_name
        user.last_name = last_name
        user.tagline = tagline

        user.save()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(get_display_name_for_youtify_user_model(user))

class SettingsHandler(webapp2.RequestHandler):

    def get(self):
        user = get_current_youtify_user_model()
        settings = get_settings_struct_for_youtify_user_model(user)
        self.response.out.write(simplejson.dumps(settings))

    def post(self):
        user = get_current_youtify_user_model()
        user.send_new_follower_email = self.request.get('send_new_follower_email') == 'true'
        user.send_new_subscriber_email = self.request.get('send_new_subscriber_email') == 'true'
        user.lastfm_scrobble_automatically = self.request.get('lastfm_scrobble_automatically') == 'true'
        user.save()

        logging.info(self.request)

        settings = get_settings_struct_for_youtify_user_model(user)
        self.response.out.write(simplejson.dumps(settings))

class FollowingsHandler(webapp2.RequestHandler):

    def delete(self, uid):
        me = get_current_youtify_user_model()
        other_user = get_youtify_user_model_by_id_or_nick(uid)

        if other_user is None:
            self.error(400)
            self.response.out.write('Other user not found')
            return

        m = FollowRelation.all().filter('user1 =', me.key().id()).filter('user2 =', int(uid)).get()
        if m:
            m.delete()

        me.nr_of_followings -= 1
        other_user.nr_of_followers -= 1

        me.save()
        other_user.save()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

    def post(self, uid):
        other_user = YoutifyUser.get_by_id(int(uid))
        me = get_current_youtify_user_model()

        if other_user is None:
            self.error(400)
            self.response.out.write('Other user not found')
            return

        if me.key().id() == other_user.key().id():
            self.error(400)
            self.response.out.write('You can not follow yourself')
            return

        if FollowRelation.all().filter('user1 =', me).filter('user2 =', other_user).get():
            self.error(400)
            self.response.out.write('You already follow that user')
            return

        me.nr_of_followings += 1
        other_user.nr_of_followers += 1

        me.save()
        other_user.save()

        m = FollowRelation(user1=me.key().id(), user2=other_user.key().id())
        m.put()

        create_follow_activity(me, other_user)
        send_new_follower_email(me, other_user)

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

class YouTubeUserNameHandler(webapp2.RequestHandler):
    def get(self):
        user = get_current_youtify_user_model()
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(user.youtube_username)

    def post(self):
        username = self.request.get('username')

        user = get_current_youtify_user_model()
        user.youtube_username = username
        user.save()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

class ExternalUserSubscriptionsHandler(webapp2.RequestHandler):
    def get(self):
        user = get_current_youtify_user_model()
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(get_external_user_subscriptions_struct_for_youtify_user_model(user)))

class PlaylistsHandler(webapp2.RequestHandler):

    def get(self):
        """Get the users playlists, including private ones"""
        user = get_current_youtify_user_model()
        if user:
            json = get_playlist_overview_structs(user, True)
        else:
            json = []
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

class MeHandler(webapp2.RequestHandler):

    def get(self):
        """Get the currnet user, incuding private data"""
        user = get_current_youtify_user_model()
        if user:
            json = get_youtify_user_struct(user, include_private_data=True)
        else:
            json = {
            }
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

class DeviceTokenHandler(webapp2.RequestHandler):

    def get(self):
        """Set a new device token for the user"""
        user = get_current_youtify_user_model()
        user.device = generate_device_token()
        user.save()
        json = {
            'device': user.device
        }
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

class LastNotificationSeenTimestampHandler(webapp2.RequestHandler):

    def post(self):
        user = get_current_youtify_user_model()
        val = self.request.get('val')
        json = {
            'message': '',
        }
        if user:
            if val > user.last_notification_seen_timestamp:
                user.last_notification_seen_timestamp = val
                user.save()
                json['message'] = 'timestamp updated'
            else:
                json['message'] = 'newer timestamp already set'
        else:
            json['message'] = 'no user found'
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

app = webapp2.WSGIApplication([
        ('/me', MeHandler),
        ('/me/last-notification-seen-timestamp', LastNotificationSeenTimestampHandler),
        ('/me/external_user_subscriptions', ExternalUserSubscriptionsHandler),
        ('/me/youtube_username', YouTubeUserNameHandler),
        ('/me/profile', ProfileHandler),
        ('/me/playlists', PlaylistsHandler),
        ('/me/request_new_device_token', DeviceTokenHandler),
        ('/me/settings', SettingsHandler),
        ('/me/followings/(.*)', FollowingsHandler),
    ], debug=False)
