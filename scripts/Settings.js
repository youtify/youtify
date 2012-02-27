function Settings() {
    var settings = JSON.parse(localStorage.settings || '{}');

    this.language = settings.language || autoDetectedLanguageByServer;
	this.enableTranslationTool = settings.enableTranslationTool || false;
	this.quality = settings.quality || 'hd720';
	this.announceTimeout = settings.announceTimeout || 3000;

    this.save = function() {
        localStorage.settings = JSON.stringify({
            'language': this.language,
            'enableTranslationTool': this.enableTranslationTool,
			'quality': this.quality,
			'announceTimeout': this.announceTimeout
        });
    };
}
