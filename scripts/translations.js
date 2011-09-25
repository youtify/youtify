function translations_Init() {
    var settings = new Settings();
    changeLanguage(settings.language);

    $('#settings .language select').change(function() {
        var code = $(this).val();
        var settings = new Settings();
        settings.language = code;
        settings.save();
        changeLanguage(code);
    });

    $('#translator-panel .close').click(function() {
        $('#translatorMode').removeAttr('checked').change();
    });
    $('#translatorMode').change(function() {
        var mode = $(this).is(':checked');
        var settings = new Settings();

        settings.translatorMode = mode;
        settings.save();

        if (mode) {
            $('#translator-panel').show();
            $('html').addClass('translator');
            $('#results-container').hide();
            loadTranslatorPanel();
        } else {
            $('#translator-panel').hide();
            $('html').removeClass('translator');
            $('#results-container').show();
        }
        
        $(window).resize();
    });

    if (settings.translatorMode) {
        $('#translatorMode').attr('checked', 'checked').change();
    }
}

var translations,
    TRANSLATABLE_ATTRIBUTES = [
        'title',
        'alt',
        'placeholder'
    ];

function updateMarkup(translations) {
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

        if (translations.hasOwnProperty(key)) {
            elem.text(translations[key]);
        }

        $.each(TRANSLATABLE_ATTRIBUTES, function(j, attr) {
            if (elem.attr(attr) !== undefined) {
                if (translationKeys.hasOwnProperty(attr)) {
                    key = translationKeys[attr];
                } else {
                    key = elem.attr(attr);
                    translationKeys[attr] = key;
                }
                if (translations.hasOwnProperty(key)) {
                    elem.attr(attr, translations[key]);
                }
            }
        });

        elem.data('translationKeys', translationKeys);
    });

    loadTranslatorPanel();
}

function changeLanguage(code) {
    $('#settings .language option[value=' + code + ']').attr('selected', 'selected');

    if (autoDetectedLanguageByServer === code) {
        updateMarkup(autoDetectedTranslations)
    } else {
        $.getJSON('/translations/' + code, function(data, textStatus) {
            updateMarkup(data);
        });
    }
}

/**
 * Locates an translatable element in the DOM by its translation source text.
 */
function findTranslatable(key) {
    var ret;

    $('.translatable').each(function(i, elem) {
        elem = $(elem);
        var translationKeys = elem.data('translationKeys') || {};

        if (translationKeys.hasOwnProperty('text') && translationKeys.text === key) {
            ret = elem;
            return false;
        }

        $.each(TRANSLATABLE_ATTRIBUTES, function(j, attr) {
            if (elem.attr(attr) !== undefined) {
                if (translationKeys.hasOwnProperty(attr) && translationKeys[attr] === key) {
                    ret = elem;
                    return false;
                }
            }
        });
    });

    return ret;
}

function loadTranslatorPanel() {
    var key,
        tr,
        input;

    $('#translator-panel tbody').html('');

    inputBlurHandler = function() {
        $('.selected-translation').removeClass('selected-translation');
    };
    inputFocusHandler = function() {
        var tr = $(this).parent().parent();
        var key = tr.find('td.source').text();
        var elem = findTranslatable(key);
        if (elem) {
            elem.addClass('selected-translation');
        }
    };

    for (key in translations) {
        if (translations.hasOwnProperty(key)) {
            tr = $('<tr/>');
            $('<td class="source"/>').text(key).appendTo(tr);
            input = $('<input type="text" />').val(translations[key]);
            input.focus(inputFocusHandler);
            input.blur(inputBlurHandler);
            $('<td/>').append(input).appendTo(tr);
            tr.appendTo('#translator-panel tbody');
        }
    }
}
