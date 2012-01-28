import os

CLIENT_ID = ''
CLIENT_SECRET = ''

ON_PRODUCTION = os.environ['SERVER_SOFTWARE'].startswith('Google App Engine') # http://stackoverflow.com/questions/1916579/in-python-how-can-i-test-if-im-in-google-app-engine-sdk

if ON_PRODUCTION:
    REDIRECT_URL = 'http://www.youtify.com/flattrback'
else:
    REDIRECT_URL = 'http://localhost:8080/flattrback'
