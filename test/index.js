var i18n = require('..');

i18n.defaultLocale = 'fr';
i18n.debug();

i18n.load("messages", function(err, locales) {
	if (err) {
		throw err;
	}
	console.log("Loaded locales", locales);
	console.log(i18n.translate('x'));       // x (en français)
	console.log(i18n.translate('y'));       // y
	console.log(i18n.translate('x', 'en')); // x (in English) 
	for (var n=0; n<6; n++) {
		console.log(i18n.plural('You have {n} messages', n, 'fr'));
	}
	console.log(i18n.translate('Hello, {name}', {name:'Jones', context:'male'}));    // Bonjour, monsieur Jones
	console.log(i18n.translate('Hello, {name}', {name:'Jones', context:'female'}));  // Bonjour, mademoiselle Jones
	console.log(i18n.translate('Hello, {name}', {name:'Jones', context:'unknown'})); // Bonjour, Jones
});
