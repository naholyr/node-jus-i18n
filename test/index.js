var i18n = require('..');

i18n.load();
i18n.defaultLocale = 'fr';
i18n.debug();
console.log(i18n.translate('guy'));
console.log(i18n.translate('guys'));
console.log(i18n.translate('guy', 'en'));
for (var n=0; n<5; n++) {
	console.log(i18n.plural('You have %n% messages', n, 'fr'));
}
