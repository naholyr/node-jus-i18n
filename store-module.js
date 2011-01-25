var data = {};

var modules = exports.i18nDataModuleName = {
	"__default__": process.cwd() + "/i18n-data",
};

function addLocales(catalogue, messages) {
	for (var locale in messages) {
		addMessages(catalogue, locale, messages[locale] || {});
	}
}

function addMessages(catalogue, locale, messages) {
	if (!data[catalogue]) {
		data[catalogue] = {};
	}
	if (!data[catalogue][locale]) {
		data[catalogue][locale] = messages;
	} else {
		for (var message in messages) {
			data[catalogue][locale][message] = messages[message];
		}
	}
}

exports.load = function load(catalogue, locale) {
	var module = modules[catalogue] || (modules.__default__ + "/" + catalogue);
	if (locale) {
		module += "/" + locale;
	}
	try {
		var messages = require(module);
	} catch (err) {
		console.warn(err.message);
		return false;
	}

	if (!data[catalogue]) {
		data[catalogue] = {};
	}
	if (!locale) {
		addLocales(catalogue, messages);
	} else {
		addMessages(catalogue, locale, messages);
	}
	return true;
};

exports.getAll = function(locale, catalogue) {
	return (data[catalogue] || {})[locale];
};

exports.get = function(key, locale, catalogue) {
	return (this.getAll(locale, catalogue) || {})[key];
};
