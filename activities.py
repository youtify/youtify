from model import YoutifyUser
from model import FollowRelation
from model import Activity
from model import get_youtify_user_struct
from model import get_playlist_struct_from_playlist_model
from model import get_external_user_subscription_struct
from django.utils import simplejson

def create_follow_activity(owner, other_user):
    """ owner started following other_user 

    Both owner and other_user gets a new activity
    """
    target = simplejson.dumps(get_youtify_user_struct(other_user))
    actor = simplejson.dumps(get_youtify_user_struct(owner))

    m = Activity(owner=owner, verb='follow', actor=actor, target=target, type='outgoing')
    m.put()

    m = Activity(owner=other_user, verb='follow', actor=actor, target=target, type='incoming')
    m.put()

def create_subscribe_activity(youtify_user_model, playlist_model):
    """ user subscribed to playlist

    Both user and playlists owner gets a new activity
    """
    target = simplejson.dumps(get_playlist_struct_from_playlist_model(playlist_model))
    actor = simplejson.dumps(get_youtify_user_struct(youtify_user_model))

    m = Activity(owner=youtify_user_model, verb='subscribe', actor=actor, target=target, type='outgoing')
    m.put()

    m = Activity(owner=playlist_model.owner, verb='subscribe', actor=actor, target=target, type='incoming')
    m.put()

def create_signup_activity(youtify_user_model):
    target = simplejson.dumps({})
    actor = simplejson.dumps(get_youtify_user_struct(youtify_user_model))

    m = Activity(owner=youtify_user_model, verb='signup', actor=actor, target=target, type='outgoing')
    m.put()

def create_flattr_activity(youtify_user_model, thing_id, thing_title):
    target = simplejson.dumps({
        'thing_id': thing_id,
        'thing_title': thing_title,
    })
    actor = simplejson.dumps(get_youtify_user_struct(youtify_user_model))

    m = Activity(owner=youtify_user_model, verb='flattr', actor=actor, target=target, type='outgoing')
    m.put()

    for relation in FollowRelation.all().filter('user2 =', youtify_user_model.key().id()):
        m = Activity(owner=YoutifyUser.get_by_id(relation.user1), verb='flattr', actor=actor, target=target, type='incoming')
        m.put()

def create_external_subscribe_activity(youtify_user_model, external_user_model):
    target = simplejson.dumps(get_external_user_subscription_struct(external_user_model))
    actor = simplejson.dumps(get_youtify_user_struct(youtify_user_model))

    m = Activity(owner=youtify_user_model, verb='external_subscribe', actor=actor, target=target, type='outgoing')
    m.put()

    for relation in FollowRelation.all().filter('user2 =', youtify_user_model.key().id()):
        m = Activity(owner=YoutifyUser.get_by_id(relation.user1), verb='external_subscribe', actor=actor, target=target, type='incoming')
        m.put()
