import logging
import webapp2
from datetime import datetime
from dateutil import parser
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import urlfetch
import json as simplejson
from activities import create_external_subscribe_activity
from model import get_current_youtify_user_model
from model import get_youtify_user_struct
from model import ExternalUser
from model import ExternalUserTimestamp
from model import get_external_user_subscription_struct

class TopExternalUsers(webapp2.RequestHandler):

    def get(self, max):
        """Gets a list of external users"""
        page = int(self.request.get('page', '0'))
        page_size = int(max)
        
        json = memcache.get('TopExternalUsers-' + str(page_size) + '*' + str(page))
        
        if json is None:
            users = ExternalUser.all().order('-nr_of_subscribers').fetch(page_size, page_size * page)
            json = []
            for user in users:
                json.append(get_external_user_subscription_struct(user))
            json = simplejson.dumps(json)
            memcache.set('TopExternalUsers-' + str(page_size) + '*' + str(page), json, 60*5)
        
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json)

class SubscribersHandler(webapp2.RequestHandler):
    
    def get(self, type, external_user_id):
        """Gets the subscribers of an external user"""
        external_user_model = ExternalUser.all().filter('type =', type).filter('external_user_id =', external_user_id).get()
        json = []

        if external_user_model is not None:
            for key in external_user_model.subscribers:
                youtify_user_model = db.get(key)
                json.append(get_youtify_user_struct(youtify_user_model))

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

    def post(self, type, external_user_id):
        """Subscribes to an external user"""
        youtify_user_model = get_current_youtify_user_model()
        if youtify_user_model == None:
            self.error(403)
            return
        
        external_user_model = ExternalUser.all().filter('type =', type).filter('external_user_id =', external_user_id).get()
        if external_user_model is None:
            external_user_model = ExternalUser(type=type, external_user_id=external_user_id) 

            # @XXX should not trust client with this information, fetch from server instead
            external_user_model.username = self.request.get('username')
            external_user_model.avatar_url = self.request.get('avatar_url')
            external_user_model.get_last_updated = True

            external_user_model.save()
        
        if external_user_model.key() in youtify_user_model.external_user_subscriptions:
            self.error(400)
            self.response.out.write('You already subscribe to this external user')
            return
            
        youtify_user_model.external_user_subscriptions.append(external_user_model.key())
        youtify_user_model.save()
        
        external_user_model.subscribers.append(youtify_user_model.key())
        external_user_model.nr_of_subscribers = len(external_user_model.subscribers)
        external_user_model.get_last_updated = True
        external_user_model.save()

        create_external_subscribe_activity(youtify_user_model, external_user_model)
        
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')
    
    def delete(self, type, external_user_id):
        """Unsubscribes from an external user"""
        youtify_user_model = get_current_youtify_user_model()
        if youtify_user_model == None:
            self.error(403)
            return
        
        external_user_model = ExternalUser.all().filter('type =', type).filter('external_user_id =', external_user_id).get()
        
        youtify_user_model.external_user_subscriptions.remove(external_user_model.key())
        youtify_user_model.save()
        
        external_user_model.subscribers.remove(youtify_user_model.key())
        external_user_model.nr_of_subscribers = len(external_user_model.subscribers)
        
        if external_user_model.nr_of_subscribers > 0:
            external_user_model.get_last_updated = True
        else:
            external_user_model.get_last_updated = False
        external_user_model.save()
        
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

class MarkAsViewedHandler(webapp2.RequestHandler):
    
    def post(self, type, external_user_id):
        """Marks the external user as viewed"""
        youtify_user_model = get_current_youtify_user_model()
        if youtify_user_model == None:
            self.response.out.write('user not logged in')
            logging.info('user not logged in')
            self.error(403)
            return
        
        external_user_model = ExternalUser.all().filter('type =', type).filter('external_user_id =', external_user_id).get()
        if external_user_model == None:
            logging.info('external user ' + external_user_id + ' not found')
            self.response.out.write('external user ' + external_user_id + ' not found')
            self.error(404)
            return
        external_user_timestamp = ExternalUserTimestamp.all().filter('external_user =', external_user_model).filter('user =', youtify_user_model).get()
        
        if external_user_timestamp == None:
            external_user_timestamp = ExternalUserTimestamp(external_user = external_user_model.key(), user = youtify_user_model.key())
        
        external_user_timestamp.last_viewed = datetime.now()
        external_user_timestamp.save()
        
        self.response.out.write('ok')

class ExternalUserCronHandler(webapp2.RequestHandler):
    """ Update last_updated on ExternalUsers """

    def get(self):
        external_users = ExternalUser.all().filter('get_last_updated =', True).order('last_updated').order('-nr_of_subscribers').fetch(50)
        for external_user in external_users:
            if external_user.type == 'soundcloud':
                try:
                    last_date = datetime.fromtimestamp(0)
                    url = 'http://api.soundcloud.com/users/' + external_user.external_user_id + '/tracks.json?consumer_key=206f38d9623048d6de0ef3a89fea1c4d'
                    response = urlfetch.fetch(url=url, method=urlfetch.GET)
                    if response.status_code == 200:
                        tracks = simplejson.loads(response.content)
                        for track in tracks:
                            date_temp = datetime.fromtimestamp(0)
                            if 'created_at' in track:
                                date_temp = parser.parse(track['created_at'])
                            if date_temp.time() > last_date.time():
                                last_date = date_temp
                        if last_date.time() > datetime.fromtimestamp(0).time() and last_date.time() != external_user.last_updated.time():
                            external_user.last_updated = last_date
                            external_user.save()
                except:
                    pass
            
            if external_user.type == 'youtube':
                try:
                    url = 'https://gdata.youtube.com/feeds/api/users/' + external_user.external_user_id + '/uploads?alt=json&v=2'
                    response = urlfetch.fetch(url=url, method=urlfetch.GET)
                    logging.info(response.status_code)
                    if response.status_code == 200:
                        tracks = simplejson.loads(response.content)
                        updated = tracks['feed']['updated']['$t']
                        last_date = parser.parse(updated)
                        if last_date.time() != external_user.last_updated.time():
                            external_user.last_updated = last_date
                            external_user.save()
                except:
                    pass
        
app = webapp2.WSGIApplication([
        ('/api/external_users/(.*)/(.*)/subscribers', SubscribersHandler),
        ('/api/external_users/top/(.*)', TopExternalUsers),
        ('/api/external_users/(.*)/(.*)/markasviewed', MarkAsViewedHandler),
        ('/cron/update_external_users', ExternalUserCronHandler),
    ], debug=True)
