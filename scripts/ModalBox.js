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
    var elem = $('<button></button>').text(label);
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
