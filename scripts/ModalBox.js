function ModalBox() {
    var self = this;
    this.canBeClosed = false;
    this.view = $('<div class="modalbox"><div class="wrapper"><p></p><div class="buttons"></div></div></div>');
    this.view.click(function(e) {
        if ($(e.target).hasClass('modalbox') && self.canBeClosed) {
            self.remove();
        }
    });
}

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

/* FLATTR DIALOG
 ****************************************************************************/

function WhatIsFlattrDialog() {
    ModalBox.call(this);

    this.setMessage('Flattr is an easy way to send micropayments. With your help we can create a sustainable way for music artists to get paid.');

    this.canBeClosed = true;

    this.addButton('Connect your Flattr account', function(self) {
        location.href = '/flattrconnect';
    });

    this.addButton('Cancel', function(self) {
        self.remove();
    });
}

WhatIsFlattrDialog.prototype = new ModalBox();
WhatIsFlattrDialog.prototype.constructor = WhatIsFlattrDialog;

/* EDIT PROFILE DIALOG
 ****************************************************************************/

function EditProfileDialog() {
    ModalBox.call(this);

    this.view.addClass('edit-profile');

    this.view.find('.wrapper p').append($('<span>Nickname:</span>'));
    this.view.find('.wrapper p').append($('<input type="text" name="nickname" />').val(UserManager.currentUser.nickname));

    this.view.find('.wrapper p').append($('<span>First name:</span>'));
    this.view.find('.wrapper p').append($('<input type="text" name="first_name" />').val(UserManager.currentUser.firstName));

    this.view.find('.wrapper p').append($('<span>Last name:</span>'));
    this.view.find('.wrapper p').append($('<input type="text" name="last_name" />').val(UserManager.currentUser.lastName));

    this.view.find('.wrapper p').append($('<span>Tagline:</span>'));
    this.view.find('.wrapper p').append($('<textarea name="tagline"></textarea>').val(UserManager.currentUser.tagline));

    this.canBeClosed = true;

    this.addButton('Save', function(self) {
        var params = {};
        $.each(self.view.find('input, textarea'), function(i, elem) {
            params[elem.name] = elem.value;
        });
        UserManager.currentUser.saveProfile(params);
        self.remove();
    });

    this.addButton('Cancel', function(self) {
        self.remove();
    });
}

EditProfileDialog.prototype = new ModalBox();
EditProfileDialog.prototype.constructor = EditProfileDialog;

