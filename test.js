var i18n = require('./i18n');

i18n.load();
i18n.defaultLocale = 'fr';
i18n.debug();
console.log(i18n.translate('guy'));
console.log(i18n.translate('guys'));
console.log(i18n.translate('guy', 'en'));
