from model import Activity
from model import get_youtify_user_struct
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
