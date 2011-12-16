import logging
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import users
from django.utils import simplejson
from model import Language
from model import SnapshotMetadata
from model import SnapshotContent

deployed_translations = {}

def init_cached_translations():
    """This method initializes the app cached translations"""
    global deployed_translations
    logging.info("Initializing cached translations")
    metadata = SnapshotMetadata.all().filter('active =', True).get()
    if metadata:
        snapshot = SnapshotContent.all().filter('metadata =', metadata).get()
        deployed_translations = simplejson.loads(snapshot.json)

def get_deployed_translations_json(code):
    global deployed_translations
    if code in deployed_translations:
        return simplejson.dumps(deployed_translations[code])
    return '{}'

class LatestHandler(webapp.RequestHandler):
    def get(self):
        lang_code = self.request.path.split('/')[-1]
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(get_deployed_translations_json(lang_code))

class SnapshotsHandler(webapp.RequestHandler):
    def get(self):
        json = [];
        for snapshot in SnapshotMetadata.all().order('-date'):
            json.append({
                'id': snapshot.key().id(),
                'date': snapshot.date.strftime('%Y-%m-%d %H:%m'),
                'active': snapshot.active,
            })
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(json))

    def post(self):
        """Deploy action"""
        json = {}
        for language in Language.all():
            translations = {}
            for key in language.translations:
                translation = db.get(key)
                translations[translation.phrase.text] = translation.text
            json[language.code] = translations
        json = simplejson.dumps(json)

        active_snapshot = SnapshotMetadata.all().filter('active =', True).get()
        if active_snapshot:
            active_snapshot.active = False
            active_snapshot.save()

        metadata = SnapshotMetadata(active=True)
        metadata.put()
        content = SnapshotContent(metadata=metadata, json=json)
        content.put()

        init_cached_translations()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('success')

    def delete(self):
        """Delete specific snapshot"""
        if not users.is_current_user_admin():
            self.error(403)

        snapshot_id = self.request.path.split('/')[-1]
        metadata = SnapshotMetadata.get_by_id(int(snapshot_id))
        content = SnapshotContent.all().filter('metadata =', metadata).get()

        if metadata:
            content.delete()
            metadata.delete()
            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('success');
        else:
            self.error(404)

    def put(self):
        """Mark a specific snapshot as active"""
        if not users.is_current_user_admin():
            self.error(403)

        snapshot_id = self.request.path.split('/')[-1]
        metadata = SnapshotMetadata.get_by_id(int(snapshot_id))

        if metadata is None:
            self.error(404)
        else:
            current = SnapshotMetadata().all().filter('active =', True).get()
            if current:
                current.active = False
                current.save()
            metadata.active = True
            metadata.save()

            init_cached_translations()

            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('success');

init_cached_translations()

def main():
    application = webapp.WSGIApplication([
        ('/api/translations/.*', LatestHandler),
        ('/snapshots.*', SnapshotsHandler),
    ], debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
