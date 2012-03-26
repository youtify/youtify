$(document).ready(init);

var page = 0;
function init() {
    getUsers(page);
    $('#prev').click(function() {
        page =- 1;
        getUsers(page)
    });
    $('#reload').click(function() {
        getUsers(page);
    });
    $('#next').click(function() {
        page += 1;
        getUsers(page);
    });
}

function getUsers(page) {
    $.ajax({
        url: '/api/migrate_users/' + page,
        statusCode: {
            200: function(data) {
                $('#info').text(data.migrated_users + '/' + data.total_users + ' migrated users');
                if (data.users === undefined || data.users === null) {
                    alert('Could not find users');
                    return;
                }
                for (var i = 0; i < data.users.length; i++) {
                    var user = data.users[i],
                        $user = $('<div class="user"/>'),
                        $title = $('<div class="title"/>')
                            .text(user.id + ' - ' + user.nickname),
                        $migrate = $('<button>')
                            .text('Migrate playlists')
                            .click(function() {
                                $.ajax({
                                    url: '/api/migrate_users/' + user.id,
                                    type: 'POST',
                                    data: null,
                                    statusCode: {
                                        200: function(data) {
                                            $user.addClass('migrated');
                                            $migrate.attr('disabled', true);
                                        },
                                        404: function(data) {
                                            $user.addClass('error');
                                        },
                                        302: function(data) {
                                            alert('Log in as admin');
                                        }
                                    }
                                });
                            });
                    $title.appendTo($user);
                    $migrate.appendTo($user);
                    $user.appendTo('#users');
                }
            },
            302: function(data) {
                alert('Log in as admin');
            }
        }
    });
};
