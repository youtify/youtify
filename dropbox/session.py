"""
dropbox.session.DropboxSession is responsible for holding OAuth authentication info
(app key/secret, request key/secret,  access key/secret) as well as configuration information for your app
('app_folder' or 'dropbox' access type, optional locale preference). It knows how to
use all of this information to craft properly constructed requests to Dropbox.

A DropboxSession object must be passed to a dropbox.client.DropboxClient object upon
initialization.
"""

import urllib
# import oauth.oauth as oauth
import oauth

from dropbox import rest

class DropboxSession(object):
    API_VERSION = 1

    API_HOST = "api.dropbox.com"
    WEB_HOST = "www.dropbox.com"
    API_CONTENT_HOST = "api-content.dropbox.com"

    def __init__(self, consumer_key, consumer_secret, access_type, locale=None):
        """Initialize a DropboxSession object.

        Your consumer key and secret are available
        at https://www.dropbox.com/developers/apps

        Args:
            access_type: Either 'dropbox' or 'app_folder'. All path-based operations
                will occur relative to either the user's Dropbox root directory
                or your application's app folder.
            locale: A locale string ('en', 'pt_PT', etc.) [optional]
                The locale setting will be used to translate any user-facing error
                messages that the server generates. At this time Dropbox supports
                'en', 'es', 'fr', 'de', and 'ja', though we will be supporting more
                languages in the future. If you send a language the server doesn't
                support, messages will remain in English. Look for these translated
                messages in rest.ErrorResponse exceptions as e.user_error_msg.
        """
        assert access_type in ['dropbox', 'app_folder'], "expected access_type of 'dropbox' or 'app_folder'"
        self.consumer = oauth.OAuthConsumer(consumer_key, consumer_secret)
        self.token = None
        self.request_token = None
        self.signature_method = oauth.OAuthSignatureMethod_PLAINTEXT()
        self.root = 'sandbox' if access_type == 'app_folder' else 'dropbox'
        self.locale = locale

    def is_linked(self):
        """Return whether the DropboxSession has an access token attached."""
        return bool(self.token)

    def unlink(self):
        """Remove any attached access token from the DropboxSession."""
        self.token = None

    def set_token(self, access_token, access_token_secret):
        """Attach an access token to the DropboxSession.

        Note that the access 'token' is made up of both a token string
        and a secret string.
        """
        self.token = oauth.OAuthToken(access_token, access_token_secret)

    def set_request_token(self, request_token, request_token_secret):
        """Attach an request token to the DropboxSession.

        Note that the reuest 'token' is made up of both a token string
        and a secret string.
        """
        self.token = oauth.OAuthToken(request_token, request_token_secret)

    def build_path(self, target, params=None):
        """Build the path component for an API URL.

        This method urlencodes the parameters, adds them
        to the end of the target url, and puts a marker for the API
        version in front.

        Args:
            target: A target url (e.g. '/files') to build upon.
            params: A dictionary of parameters (name to value). [optional]

        Returns:
            The path and parameters components of an API URL.
        """
        if type(target) == unicode:
            target = target.encode("utf8")

        target_path = urllib.quote(target)
        params = params or {}
        params = params.copy()

        if self.locale:
            params['locale'] = self.locale

        if params:
            return "/%d%s?%s" % (self.API_VERSION, target_path, urllib.urlencode(params))
        else:
            return "/%d%s" % (self.API_VERSION, target_path)

    def build_url(self, host, target, params=None):
        """Build an API URL.

        This method adds scheme and hostname to the path
        returned from build_path.

        Args:
            target: A target url (e.g. '/files') to build upon.
            params: A dictionary of parameters (name to value). [optional]

        Returns:
            The full API URL.
        """
        return "https://%s%s" % (host, self.build_path(target, params))

    def build_authorize_url(self, request_token, oauth_callback=None):
        """Build a request token authorization URL.

        After obtaining a request token, you'll need to send the user to
        the URL returned from this function so that they can confirm that
        they want to connect their account to your app.

        Args:
            request_token: A request token from obtain_request_token.
            oauth_callback: A url to redirect back to with the authorized
                request token.

        Returns:
            An authorization for the given request token.
        """
        params = {'oauth_token': request_token.key,
                  }

        if oauth_callback:
            params['oauth_callback'] = oauth_callback

        return self.build_url(self.WEB_HOST, '/oauth/authorize', params)

    def obtain_request_token(self):
        """Obtain a request token from the Dropbox API.

        This is your first step in the OAuth process.  You call this to get a
        request_token from the Dropbox server that you can then use with
        DropboxSession.build_authorize_url() to get the user to authorize it.
        After it's authorized you use this token with
        DropboxSession.obtain_access_token() to get an access token.

        NOTE:  You should only need to do this once for each user, and then you
        can store the access token for that user for later operations.

        Returns:
            An oauth.OAuthToken representing the request token Dropbox assigned
            to this app. Also attaches the request token as self.request_token.
        """
        self.token = None # clear any token currently on the request
        url = self.build_url(self.API_HOST, '/oauth/request_token')
        headers, params = self.build_access_headers('POST', url)

        response = rest.RESTClient.POST(url, headers=headers, params=params, raw_response=True)
        self.request_token = oauth.OAuthToken.from_string(response.read())
        return self.request_token

    def obtain_access_token(self, request_token=None):
        """Obtain an access token for a user.

        After you get a request token, and then send the user to the authorize
        URL, you can use the authorized request token with this method to get the
        access token to use for future operations. The access token is stored on
        the session object.

        Args:
            request_token: A request token from obtain_request_token. [optional]
                The request_token should have been authorized via the
                authorization url from build_authorize_url. If you don't pass
                a request_token, the fallback is self.request_token, which
                will exist if you previously called obtain_request_token on this
                DropboxSession instance.

        Returns:
            An oauth.OAuthToken representing the access token Dropbox assigned
            to this app and user. Also attaches the access token as self.token.
        """
        request_token = request_token or self.request_token
        assert request_token, "No request_token available on the session. Please pass one."
        url = self.build_url(self.API_HOST, '/oauth/access_token')
        headers, params = self.build_access_headers('POST', url, request_token=request_token)

        response = rest.RESTClient.POST(url, headers=headers, params=params, raw_response=True)
        self.token = oauth.OAuthToken.from_string(response.read())
        return self.token

    def build_access_headers(self, method, resource_url, params=None, request_token=None):
        """Build OAuth access headers for a future request.

        Args:
            method: The HTTP method being used (e.g. 'GET' or 'POST').
            resource_url: The full url the request will be made to.
            params: A dictionary of parameters to add to what's already on the url.
                Typically, this would consist of POST parameters.

        Returns:
            A tuple of (header_dict, params) where header_dict is a dictionary
            of header names and values appropriate for passing into dropbox.rest.RESTClient
            and params is a dictionary like the one that was passed in, but augmented with
            oauth-related parameters as appropriate.
        """
        if params is None:
            params = {}
        else:
            params = params.copy()

        oauth_params = {
            'oauth_consumer_key': self.consumer.key,
            'oauth_timestamp': oauth.generate_timestamp(),
            'oauth_nonce': oauth.generate_nonce(),
            'oauth_version': oauth.OAuthRequest.version,
        }

        token = request_token if request_token else self.token

        if token:
            oauth_params['oauth_token'] = token.key

        params.update(oauth_params)

        oauth_request = oauth.OAuthRequest.from_request(method, resource_url, parameters=params)
        oauth_request.sign_request(self.signature_method, self.consumer, token)

        return oauth_request.to_header(), params
