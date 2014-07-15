import os

EMAIL_UNSUBSCRIBE_SALT = 'abc'

CLIENT_ID = ''
CLIENT_SECRET = ''
DROPBOX_APP_KEY = ''
DROPBOX_APP_SECRET = ''
DROPBOX_CALLBACK_URL = ''
DROPBOX_ACCESS_TYPE = 'app_folder'
LASTFM_APP_KEY = ''
LASTFM_APP_SECRET = ''
LASTFM_REDIRECT_URL = ''

ON_PRODUCTION = os.environ['SERVER_SOFTWARE'].startswith('Google App Engine') # http://stackoverflow.com/questions/1916579/in-python-how-can-i-test-if-im-in-google-app-engine-sdk

if ON_PRODUCTION:
    LASTFM_REDIRECT_URL = 'http://www.youtify.com/lastfm/callback'
    DROPBOX_CALLBACK_URL = 'http://www.youtify.com/api/dropbox/callback'
else:
    LASTFM_REDIRECT_URL = 'http://localhost:8080/lastfm/callback'
    DROPBOX_CALLBACK_URL = 'http://localhost:8080/api/dropbox/callback'
