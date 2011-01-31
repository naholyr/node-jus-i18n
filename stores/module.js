var data = {};

var modules = {
	"__default__": process.cwd() + "/i18n-data"
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

exports.load = function load(catalogue, locales, i18n, callback) {
	if (typeof locales == 'undefined') {
		// No locales: load by catalogue
		try {
			var module = modules[catalogue] || (modules.__default__ + "/" + catalogue);
			var messages = require(module);
			addLocales(catalogue, messages);
			var loadedLocales = [];
			for (var locale in messages) {
				loadedLocales.push(locale);
			}
		} catch (e) {
			return callback({'ALL':new Error('Cannot load catalogue')}, undefined, this);
		}
		return callback(undefined, loadedLocales, exports);
	} else {
		// Load specified locales
		(function() {
			var errors = undefined, loadedLocales = [], nbDone = 0, nbLocales = locales.length;
			locales.forEach(function(locale) {
				try {
					var module = (modules[catalogue] || (modules.__default__ + "/" + catalogue)) + "/" + locale;
					var messages = require(module);
					if (!data[catalogue]) {
						data[catalogue] = {};
					}
					addMessages(catalogue, locale, messages);
					loadedLocales.push(locale);
				} catch (e) {
					if (!errors) {
						errors = {};
					}
					errors[locale] = e;
				}
				nbDone++;
			});
			function runWhenAllDone() {
				if (nbDone < nbLocales) {
					setTimeout(runWhenAllDone, 1);
				} else {
					callback(errors, loadedLocales, exports);
				}
			}
			runWhenAllDone();
		})();
	}
};

function getAll(locale, catalogue) {
	return (data[catalogue] || {})[locale];
}

exports.get = function get(key, locale, catalogue) {
	return (getAll(locale, catalogue) || {})[key];
};

exports.configure = function configure(options, callback) {
	if (typeof options != 'object') {
		return callback(new Error('Invalid options'), this);
	}
	if (options.paths) {
		for (var name in options.paths) {
			modules[name] = options.paths[name];
		}
	}
	return callback(undefined, this);
};

exports.locales = function locales(prefix, catalogue, callback) {
	callback(new Error('Not implemented'), undefined, this);
};

exports.catalogues = function catalogues(callback) {
	callback(new Error('Not implemented'), undefined, this);
};
