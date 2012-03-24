
(function GetUsers() {
    $.ajax({
        url: '/api/migrate_users/0',
        statusCode: {
            200: function(data) {
                $('#info').text(data.migrated_users + '/' + data.total_users + ' migrated users');
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
                                        }
                                    }
                                });
                            });
                    $title.appendTo($user);
                    $migrate.appendTo($user);
                    $user.appendTo('#users');
                }
            }
        }
    });
})();
