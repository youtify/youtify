var TranslationSystem = {
    TRANSLATABLE_ATTRIBUTES: [
        'title',
        'alt',
        'placeholder'
    ],
    translations: undefined,

    init: function() {
        var settings = new Settings();
        TranslationSystem.changeLanguage(settings.language);

        $('#translations').click(function() {
            $(this).arrowPopup("#translationsPopup");
        });
    },

    get: function(original, vars) {
        var phrase = original;
        var key;
        if (TranslationSystem.translations.hasOwnProperty(original) && TranslationSystem.translations[original].length) {
            phrase = TranslationSystem.translations[original];
        }
        for (key in vars) {
            if (vars.hasOwnProperty(key)) {
                phrase = phrase.replace(key, vars[key]);
            }
        }
        return phrase;
    },

    updateMarkup: function(data) {
        TranslationSystem.translations = data; // global

        $('.translatable').each(function(i, elem) {
            elem = $(elem);

            var translationKeys = elem.data('translationKeys') || {},
                key;

            if (translationKeys.hasOwnProperty('text')) {
                key = translationKeys.text;
            } else {
                key = elem.text();
                translationKeys.text = key;
            }

            if (TranslationSystem.translations.hasOwnProperty(key)) {
                elem.text(TranslationSystem.get(key));
            }

            $.each(TranslationSystem.TRANSLATABLE_ATTRIBUTES, function(j, attr) {
                if (elem.attr(attr) !== undefined) {
                    if (translationKeys.hasOwnProperty(attr)) {
                        key = translationKeys[attr];
                    } else {
                        key = elem.attr(attr);
                        translationKeys[attr] = key;
                    }
                    if (TranslationSystem.translations.hasOwnProperty(key)) {
                        elem.attr(attr, TranslationSystem.get(key));
                    }
                }
            });

            elem.data('translationKeys', translationKeys);
        });
    },

    changeLanguage: function(code) {
        $('#settings .language option[value=' + code + ']').attr('selected', 'selected');

        if (autoDetectedLanguageByServer === code) {
            TranslationSystem.updateMarkup(autoDetectedTranslations);
        } else {
            $.getJSON('/api/translations/' + code, function(data, textStatus) {
                TranslationSystem.updateMarkup(data);
            });
        }
    }
};
