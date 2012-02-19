function ModalBox(args) {
    self = this;
    this.view = $('<div class="modalbox"><div class="wrapper"><p></p><div class="buttons"></div></div></div>');
    this.view.find('.wrapper p').text(args.message);

    $.each(args.buttons, function(i, button) {
        var elem = $('<button></button>').text(button.label);
        elem.click(button.callback);
        self.view.find('.buttons').append(elem);
    });

    this.show = function() {
        $('body').append(this.view);
    };

    this.remove = function() {
        this.view.remove();
    };
}

function ReloadDialog() {
}

ReloadDialog.prototype = new ModalBox({
    message: 'Your account has been used somewhere else. Please reload the page.',
    buttons: [
        {
            label: 'Reload',
            callback: function() {
                location.reload();
            }
        }
    ]
});

function WhatIsFlattrDialog() {
}

WhatIsFlattrDialog.prototype = new ModalBox({
    message: 'Flattr is an easy way to send micropayments. With your help we can create a sustainable way for music artists to get paid.',
    buttons: [
        {
            label: 'Connect your Flattr account',
            callback: function() {
                location.href = '/flattrconnect';
            }
        }
    ]
});
