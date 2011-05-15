var i18n = require(__dirname + '/..');

i18n.defaultLocale = 'fr';
i18n.debug();

i18n.setStore('file', { "paths": [__dirname + "/i18n-data"] }, function(err) {
	if (err) {
		throw err;
	}
	console.log("Configured store");
	i18n.load("messages", function(err, locales) {
		if (err) {
			throw err.ALL || err;
		}
		console.log("Loaded locales", locales);
		console.log(i18n.translate('x'));       // x (en français)
		console.log(i18n.translate('y'));       // [T]y[/T]
		i18n.debug(false);
		console.log(i18n.translate('y'));       // y
		i18n.debug(true);
		console.log(i18n.translate('x', 'en')); // x (in English) 
		for (var n=0; n<6; n++) {
			console.log(i18n.plural('You have {n} messages', n, 'fr'));
		}
		i18n.defaultLocale = 'fr';
		console.log(i18n.translate('Hello, {name}', {name:'Jones', context:'male'}));    // Bonjour, monsieur Jones
		console.log(i18n.translate('Hello, {name}', {name:'Jones', context:'female'}));  // Bonjour, mademoiselle Jones
		console.log(i18n.translate('Hello, {name}', {name:'Jones', context:'unknown'})); // Bonjour, Jones
		i18n.defaultLocale = 'en';
		console.log(i18n.translate('Hello, {name}', {name:'Jones', context:'male'}));    // Hello, mister Jones
		console.log(i18n.translate('Hello, {name}', {name:'Jones', context:'female'}));  // Hello, miss Jones
		console.log(i18n.translate('Hello, {name}', {name:'Jones', context:'unknown'})); // Hello, Jones
	});
});

