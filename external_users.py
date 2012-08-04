import logging
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from django.utils import simplejson
from activities import create_external_subscribe_activity
from model import get_current_youtify_user_model
from model import get_youtify_user_struct
from model import ExternalUser
from model import get_external_user_subscription_struct

class TopExternalUsers(webapp.RequestHandler):

    def get(self, max):
        """Gets a list of external users"""
        users = ExternalUser.all().fetch(int(max));
        json = []
        for user in users:
            json.append(get_external_user_subscription_struct(user))
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

class SubscribersHandler(webapp.RequestHandler):
    
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

            external_user_model.save()
        
        if external_user_model.key() in youtify_user_model.external_user_subscriptions:
            self.error(400)
            self.response.out.write('You already subscribe to this external user')
            return
            
        youtify_user_model.external_user_subscriptions.append(external_user_model.key())
        youtify_user_model.save()
        
        external_user_model.subscribers.append(youtify_user_model.key())
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
        external_user_model.save()
        
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')

def main():
    application = webapp.WSGIApplication([
        ('/api/external_users/(.*)/(.*)/subscribers', SubscribersHandler),
        ('/api/external_users/top/(.*)', TopExternalUsers),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
