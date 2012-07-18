function ModalBox() {
    var self = this;
    this.view = $('<div class="modalbox"><div class="wrapper"><div class="top"></div><p></p><div class="buttons"></div></div></div>');
}

ModalBox.prototype.setCanBeClosed = function(canBeClosed) {
    self = this;

    if (canBeClosed) {
        $('<span class="close">x</span>').click(function() {
            self.remove();
        }).appendTo(self.view.find('.top'));

        this.view.click(function(e) {
            if ($(e.target).hasClass('modalbox') && canBeClosed) {
                self.remove();
            }
        });
    }
};

ModalBox.prototype.setMessage = function(message) {
    this.view.find('.wrapper p').text(message);
};

ModalBox.prototype.addButton = function(label, callback) {
    var self = this;
    var elem = $('<button class="button"></button>').text(label);
    elem.click(function() {
        callback(self);
    });
    this.view.find('.buttons').append(elem);
};

ModalBox.prototype.show = function() {
    $('body').append(this.view);
};

ModalBox.prototype.remove = function() {
    this.view.remove();
};

/* RELOAD DIALOG
 ****************************************************************************/

function ReloadDialog() {
    ModalBox.call(this);

    this.setMessage('Your account has been used somewhere else. Please reload the page.');

    this.addButton('Reload', function(self) {
        location.reload();
    });
}

ReloadDialog.prototype = new ModalBox();
ReloadDialog.prototype.constructor = ReloadDialog;

/* EDIT PROFILE DIALOG
 ****************************************************************************/

function EditProfileDialog() {
    ModalBox.call(this);

    this.view.addClass('edit-profile');

    this.view.find('.wrapper p').append($('<span></span>').text(TranslationSystem.get('Nickname:')));
    this.view.find('.wrapper p').append($('<input type="text" name="nickname" />').val(UserManager.currentUser.nickname));

    this.view.find('.wrapper p').append($('<span></span>').text(TranslationSystem.get('First name:')));
    this.view.find('.wrapper p').append($('<input type="text" name="first_name" />').val(UserManager.currentUser.firstName));

    this.view.find('.wrapper p').append($('<span></span>').text(TranslationSystem.get('Last name:')));
    this.view.find('.wrapper p').append($('<input type="text" name="last_name" />').val(UserManager.currentUser.lastName));

    this.view.find('.wrapper p').append($('<span></span>').text(TranslationSystem.get('Tagline:')));
    this.view.find('.wrapper p').append($('<textarea name="tagline"></textarea>').val(UserManager.currentUser.tagline));

    this.setCanBeClosed(true);

    this.addButton(TranslationSystem.get('Save'), function(self) {
        var params = {};
        $.each(self.view.find('input, textarea'), function(i, elem) {
            params[elem.name] = elem.value;
        });
        UserManager.currentUser.saveProfile(params);
        self.remove();
    });

    this.addButton(TranslationSystem.get('Cancel'), function(self) {
        self.remove();
    });
}

EditProfileDialog.prototype = new ModalBox();
EditProfileDialog.prototype.constructor = EditProfileDialog;

/* SHARE TRACK DIALOG
 ****************************************************************************/

function ShareTrackDialog(videoOrPlaylist) {
    ModalBox.call(this);

    this.view.addClass('share');

    this.view.find('.wrapper p').append($('<input type="text" />').val(videoOrPlaylist.getUrl()));

    var $shareOnTwitter = $('<div class="share-button twitter"></span>').text(TranslationSystem.get('Share on Twitter'))
        .click(function(event) {
            event.preventDefault();
            window.open(videoOrPlaylist.getTwitterShareUrl(), TranslationSystem.get('Share on Twitter'), 'width=500, height=300');
            return false;
        });

    var $shareOnFacebook = $('<div class="share-button facebook"></span>').text(TranslationSystem.get('Share on Facebook'))
        .click(function(event) {
            event.preventDefault();
            window.open(videoOrPlaylist.getFacebookShareUrl(), TranslationSystem.get('Share on Facebook'), 'width=500, height=300');
            return false;
        });

    this.view.find('.wrapper .buttons').append($shareOnTwitter);
    this.view.find('.wrapper .buttons').append($shareOnFacebook);

    this.setCanBeClosed(true);
}

ShareTrackDialog.prototype = new ModalBox();
ShareTrackDialog.prototype.constructor = ShareTrackDialog;

/* ADD TO PLAYLIST DIALOG
 ****************************************************************************/

function AddToPlaylistDialog(videos) {
    ModalBox.call(this);

    this.view.addClass('add-to-playlist');

    this.view.find('.wrapper p').append(playlistManager.getDropdownOfAllPlaylists());

    this.addButton(TranslationSystem.get('Add to playlist'), function(self) {
        var playlistIndex = self.view.find('select').val();
        var playlist = playlistManager.getPlaylist(playlistIndex);
        $.each(videos, function(index, video) {
            playlist.addVideo(video);
        });
        playlistManager.save();
        self.remove();
    });

    this.setCanBeClosed(true);
}

AddToPlaylistDialog.prototype = new ModalBox();
AddToPlaylistDialog.prototype.constructor = AddToPlaylistDialog;
