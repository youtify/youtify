import logging
import webapp2
from google.appengine.ext.webapp import util
from google.appengine.ext import db
import json as simplejson
from model import AlternativeTrack, get_alternative_struct

class AlternativesHandler(webapp2.RequestHandler):
    
    def get(self, track_type, track_id):
        """ get alternatives for a track """
        alternatives = AlternativeTrack.all().filter('replacement_for_id = ', track_id).filter('replacement_type = ', track_type)
        json = []

        for alternative in alternatives:
            json.append(get_alternative_struct(alternative))

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

    def post(self, track_type, track_id):
        """ change rating or add a new alternative track """
        replacement_for_id = self.request.get('replacement_for_id')
        replacement_track_type = self.request.get('replacement_track_type')
        vote = int(self.request.get('vote'))

        if replacement_for_id == track_id and replacement_track_type == track_type:
            self.response.out.write('replacement cannot be the same as the track')
            self.error(400)
            return

        if vote < -1 or vote > 1:
            self.response.out.write('Rating must be in range -1 to 1')
            self.error(400)
            return
        
        alternative = AlternativeTrack.all() \
            .filter('track_id = ', track_id) \
            .filter('track_type = ', track_type) \
            .filter('replacement_for_id = ', replacement_for_id) \
            .filter('replacement_for_type = ', replacement_track_type) \
            .get()
        
        if alternative is not None:
            alternative.vote += vote
            alternative.save()
        else:
            alternative = AlternativeTrack(track_id=track_id, track_type=track_type, replacement_for_id=replacement_for_id, replacement_for_type=replacement_track_type, vote=vote)
            alternative.put()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('ok')
    
    
app = webapp2.WSGIApplication([
        ('/api/alternatives/(.*)/(.*)', AlternativesHandler),
    ], debug=True)
