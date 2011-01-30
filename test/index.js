var i18n = require('..');

i18n.defaultLocale = 'fr';
i18n.debug();

i18n.load("messages", function(err, locales) {
	if (err) {
		throw err;
	}
	console.log("Loaded locales", locales);
	console.log(i18n.translate('guy'));
	console.log(i18n.translate('guys'));
	console.log(i18n.translate('guy', 'en'));
	for (var n=0; n<5; n++) {
		console.log(i18n.plural('You have %n% messages', n, 'fr'));
	}
});
