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
    },

    get: function(original, vars) {
        var phrase = original;
        var key;
        if (TranslationSystem.translations && TranslationSystem.translations.hasOwnProperty(original) && TranslationSystem.translations[original].length) {
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
            EventSystem.callEventListeners('language_changed', code);
        } else {
            $.getJSON('/happytranslate/' + code, function(data, textStatus) {
                TranslationSystem.updateMarkup(data);
                EventSystem.callEventListeners('language_changed', code);
            });
        }

        // More timeago locales at https://github.com/rmm5t/jquery-timeago/tree/master/locales
        switch (code) {
            case 'sv_SE':
                jQuery.timeago.settings.strings = {
                  prefixAgo: "för",
                  prefixFromNow: "om",
                  suffixAgo: "sedan",
                  suffixFromNow: "",
                  seconds: "mindre än en minut",
                  minute: "ungefär en minut",
                  minutes: "%d minuter",
                  hour: "ungefär en timme",
                  hours: "ungefär %d timmar",
                  day: "en dag",
                  days: "%d dagar",
                  month: "ungefär en månad",
                  months: "%d månader",
                  year: "ungefär ett år",
                  years: "%d år"
                };
            break;

            case 'fi_FI':
                jQuery.timeago.settings.strings = {
                  prefixAgo: null,
                  prefixFromNow: null,
                  suffixAgo: "sitten",
                  suffixFromNow: "tulevaisuudessa",
                  seconds: "alle minuutti",
                  minute: "minuutti",
                  minutes: "%d minuuttia",
                  hour: "tunti",
                  hours: "%d tuntia",
                  day: "päivä",
                  days: "%d päivää",
                  month: "kuukausi",
                  months: "%d kuukautta",
                  year: "vuosi",
                  years: "%d vuotta"
                };
            break;

            case 'de_DE':
                jQuery.timeago.settings.strings = {
                  prefixAgo: "vor",
                  prefixFromNow: "in",
                  suffixAgo: "",
                  suffixFromNow: "",
                  seconds: "wenigen Sekunden",
                  minute: "etwa einer Minute",
                  minutes: "%d Minuten",
                  hour: "etwa einer Stunde",
                  hours: "%d Stunden",
                  day: "etwa einem Tag",
                  days: "%d Tagen",
                  month: "etwa einem Monat",
                  months: "%d Monaten",
                  year: "etwa einem Jahr",
                  years: "%d Jahren"
                };
            break;

            case 'fr_FR':
                jQuery.timeago.settings.strings = {
                   prefixAgo: "il y a",
                   prefixFromNow: "d'ici",
                   seconds: "moins d'une minute",
                   minute: "environ une minute",
                   minutes: "environ %d minutes",
                   hour: "environ une heure",
                   hours: "environ %d heures",
                   day: "environ un jour",
                   days: "environ %d jours",
                   month: "environ un mois",
                   months: "environ %d mois",
                   year: "un an",
                   years: "%d ans"
                };
            break;

            case 'pt_PT':
                jQuery.timeago.settings.strings = {
                   suffixAgo: "atrás",
                   suffixFromNow: "a partir de agora",
                   seconds: "menos de um minuto",
                   minute: "cerca de um minuto",
                   minutes: "%d minutos",
                   hour: "cerca de uma hora",
                   hours: "cerca de %d horas",
                   day: "um dia",
                   days: "%d dias",
                   month: "cerca de um mês",
                   months: "%d meses",
                   year: "cerca de um ano",
                   years: "%d anos"
                };
            break;
        }
    }
};
