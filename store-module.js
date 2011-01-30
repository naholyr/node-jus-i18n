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
		this.locales(function(err, locales, store) {
			if (typeof locales == 'undefined') {
				callback({'ALL':new Error('Cannot load locales')}, undefined, store);
			} else {
				store.load(catalogue, locales, i18n, callback);
			}
		});
	} else {
		var errors = {}, loadedLocales = [], nbDone = 0, nbLocales = locales.length;
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
	return callback(err, this);
};

exports.locales = function locales(prefix, callback) {
	if (typeof callback == 'undefined') {
		callback = prefix;
		prefix = '';
	}
	
};
