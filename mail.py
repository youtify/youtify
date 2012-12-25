from datetime import datetime
from hashlib import md5
from string import Template
from google.appengine.api import mail
import webapp2
from google.appengine.ext.webapp import util
from model import get_youtify_user_model_by_id_or_nick
from model import get_display_name_for_youtify_user_model
from model import get_url_for_youtify_user_model
try:
    from config import EMAIL_UNSUBSCRIBE_SALT
except ImportError:
    from config_template import EMAIL_UNSUBSCRIBE_SALT

# GAE developer doc: https://developers.google.com/appengine/docs/python/mail/

FOLLOW_MAIL_TEMPLATE =  """
$user1_display_name is now following you ($user2_display_name)

$user1_profile_url

Unsubscribe from further email notifications: $unsubscribe_link
"""

SUBSCRIBE_MAIL_TEMPLATE =  """
$user1_display_name subscribed to your playlist ($playlist_title)

$user1_profile_url

Unsubscribe from further email notifications: $unsubscribe_link
"""

# user1 started following user2
def send_new_follower_email(user1, user2):
    if not user2.send_new_follower_email:
        return

    if user2.last_emailed:
        delta = datetime.now() - user2.last_emailed
        if delta.seconds < 60:
            return

    user1_display_name = get_display_name_for_youtify_user_model(user1)
    user2_display_name = get_display_name_for_youtify_user_model(user2)
    user1_profile_url = get_url_for_youtify_user_model(user1)
    unsubscribe_link = 'http://www.youtify.com/unsubscribe?uid=%s&token=%s' % (user2.key().id(), md5(EMAIL_UNSUBSCRIBE_SALT + str(user2.key().id())).hexdigest())

    body = Template(FOLLOW_MAIL_TEMPLATE).substitute({
        'user1_display_name': user1_display_name,
        'user2_display_name': user2_display_name,
        'user1_profile_url': user1_profile_url,
        'unsubscribe_link': unsubscribe_link,
    })

    subject="%s is now following you on Youtify!" % user1_display_name

    mail.send_mail(sender="Youtify <noreply@youtify.com>",
                  to="%s <%s>" % (user2_display_name, user2.google_user2.email()),
                  subject=subject,
                  body=body)

    user2.last_emailed = datetime.now()
    user2.save()

# user1 subscribed to playlist
def send_new_subscriber_email(user1, playlist_model):
    user2 = playlist_model.owner

    if not user2.send_new_follower_email:
        return

    if user2.last_emailed:
        delta = datetime.now() - user2.last_emailed
        if delta.seconds < 60:
            return

    user1_display_name = get_display_name_for_youtify_user_model(user1)
    user2_display_name = get_display_name_for_youtify_user_model(user2)
    user1_profile_url = get_url_for_youtify_user_model(user1)
    unsubscribe_link = 'http://www.youtify.com/unsubscribe?uid=%s&token=%s' % (user2.key().id(), md5(EMAIL_UNSUBSCRIBE_SALT + str(user2.key().id())).hexdigest())

    body = Template(SUBSCRIBE_MAIL_TEMPLATE).substitute({
        'user1_display_name': user1_display_name,
        'user2_display_name': user2_display_name,
        'user1_profile_url': user1_profile_url,
        'playlist_title': playlist_model.title,
        'unsubscribe_link': unsubscribe_link,
    })

    subject="%s now subscribes to one of your playlists!" % user1_display_name

    mail.send_mail(sender="Youtify <noreply@youtify.com>",
                  to="%s <%s>" % (user2_display_name, user2.google_user2.email()),
                  subject=subject,
                  body=body)

    user2.last_emailed = datetime.now()
    user2.save()

class UnsubscribeHandler(webapp2.RequestHandler):

    def get(self):
        user = get_youtify_user_model_by_id_or_nick(self.request.get('uid'))
        if user is None:
            self.response.out.write('No such user found')
            return
        
        if md5(EMAIL_UNSUBSCRIBE_SALT + str(user.key().id())).hexdigest() == self.request.get('token'):
            user.send_new_follower_email = False
            user.send_new_subscriber_email = False
            user.save()
            self.response.out.write('You are now unsubscribed.')
        else:
            self.response.out.write('Wrong token.')

app = webapp2.WSGIApplication([
        ('/unsubscribe', UnsubscribeHandler),
    ], debug=True)
