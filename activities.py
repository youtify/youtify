from model import YoutifyUser
from model import FollowRelation
from model import Activity
from model import get_youtify_user_struct
from model import get_playlist_struct_from_playlist_model
from django.utils import simplejson

def create_follow_activity(owner, other_user):
    """ owner started following other_user 

    Both owner and other_user gets a new activity
    """
    data = simplejson.dumps(get_youtify_user_struct(other_user, include_relations=False))
    user = simplejson.dumps(get_youtify_user_struct(owner, include_relations=False))

    m = Activity(owner=owner, verb='follow', user=user, data=data)
    m.put()

    m = Activity(owner=other_user, verb='follow', user=user, data=data)
    m.put()

def create_subscribe_activity(youtify_user_model, playlist_model):
    """ user subscribed to playlist

    Both user and playlists owner gets a new activity
    """
    data = simplejson.dumps(get_playlist_struct_from_playlist_model(playlist_model))
    user = simplejson.dumps(get_youtify_user_struct(youtify_user_model, include_relations=False))

    m = Activity(owner=youtify_user_model, verb='subscribe', user=user, data=data)
    m.put()

    m = Activity(owner=playlist_model.owner, verb='subscribe', user=user, data=data)
    m.put()

def create_signup_activity(youtify_user_model):
    data = simplejson.dumps({})
    user = simplejson.dumps(get_youtify_user_struct(youtify_user_model, include_relations=False))

    m = Activity(owner=youtify_user_model, verb='signup', user=user, data=data)
    m.put()

def create_flattr_activity(youtify_user_model, thing_id, thing_title):
    data = simplejson.dumps({
        'thing_id': thing_id,
        'thing_title': thing_title,
    })
    user = simplejson.dumps(get_youtify_user_struct(youtify_user_model, include_relations=False))

    m = Activity(owner=youtify_user_model, verb='flattr', user=user, data=data)
    m.put()

    for relation in FollowRelation.all().filter('user2 =', youtify_user_model.key().id()):
        m = Activity(owner=YoutifyUser.get_by_id(relation.user1), verb='flattr', user=user, data=data)
        m.put()
