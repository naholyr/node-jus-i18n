var http = require('http');

function defaultCallback(err) {
	if (err) {
		throw err;
	}
}

function runCallback(err, callback) {
	setTimeout(function() { (callback || defaultCallback)(err, exports); }, 0);
	return typeof err == 'undefined';
}

exports.load = function load(catalogue, locales, callback) {
	if (typeof callback == 'undefined') {
		callback = locales;
		locales = undefined;
	}
	if (typeof callback == 'undefined') {
		callback = catalogue;
		catalogue = undefined;
	}
	this.store.load(catalogue || this.defaultCatalogue, locales || this.availableLocales, this, callback);
};

exports.enableForApp = function enableForApp(app, options, callback) {
	if (typeof options == 'undefined') {
		options = {};
	}
	// Load i18n data
	this.load(options.catalogue || this.defaultCatalogue, options.locales, function(err, i18n) {
		if (err) {
			return callback(err, i18n);
		}

		var defaultLocale = options.locale || i18n.defaultLocale;

		// Add helpers
		app.dynamicHelpers(i18n.dynamicHelpers);

		// Add "req.locales()"
		http.IncomingMessage.prototype.locales = function() {
			var accept = this.headers['accept-language'];
			if (!accept) {
				return [];
			}
			accept = accept.split(',');
			var cultures = [];
			for (var i=0; i<accept.length; i++) {
				var pref = accept[i].split(';');
				cultures.push({
					"name": pref[0],
					"q":    parseFloat((pref[1]||'q=1').substring(2))
				});
			}
			cultures.sort(function(a,b) { return a.q>b.q ? -1 : (a.q<b.q ? +1 : 0); });
			return cultures.map(function(c) { return c.name; });
		};

		// Add "req.locale([locale])" based on session
		http.IncomingMessage.prototype.locale = function(newValue) {
			var current = this.session[module.exports.localeSessKey];
			if (typeof newValue != 'undefined') {
				this.session[module.exports.localeSessKey] = newValue;
			}
			if (typeof current == 'undefined' && typeof defaultLocale != 'undefined') {
				current = defaultLocale;
			}
			return current;
		};

		// Add "req.i18n.translate(...)" and "req.i18n.plural(...)"
		http.IncomingMessage.prototype.i18n = {
			"translate": exports.translate.bind(exports),
			"plural":    exports.plural.bind(exports)
		};

		return callback(undefined, i18n);
	});
};

exports.localeSessKey = 'locale';
exports.store = require('./stores/module');
exports.pluralHandler = require('./plural-form');
exports.defaultLocale = 'en';
exports.defaultCatalogue = 'messages';
exports.replaceFormat = '{...}';
exports.defaultPluralReplace = 'n';
exports.availableLocales = undefined; // any locale available in store

exports.setStore = function(store, config, callback) {
	if (typeof config == 'function') {
		var tmp = callback;
		callback = config;
		config = tmp;
	}
	try {
		if (typeof store == 'string') {
			this.store = require('./stores/' + store);
		} else if (typeof store != 'undefined') {
			this.store = store;
		}
		if (typeof config != 'undefined') {
			return this.store.configure(config, callback || defaultCallback);
		}
	} catch (e) {
		return (callback || defaultCallback)(e, this.store);
	}
	return (callback || function(){return true;})(undefined, this);
};

function replaceParams(string, replacements) {
	if (typeof replacements == 'object') {
		for (var key in replacements) {
			string = string.replace(exports.replaceFormat.replace("...", key), replacements[key]);
		}
	}
	return string;
}

function getTranslation(i18n, msg, locale, catalogue, context) {
	var translation = i18n.store.get(msg, locale, catalogue, i18n);
	// Supported results
	if (typeof translation == 'function') {
		// callback(context)
		translation = translation(context);
	} else if (typeof translation == 'object') {
		// {context: translation, "": defaultTranslation}
		translation = translation[context || ""] || translation[""];
	} else if (typeof context != 'undefined') {
		// Context requested, and translation not found, or default string translation found
		var context_translation = getTranslation(i18n, context+":"+msg, locale, catalogue, undefined);
		if (typeof context_translation != 'undefined') {
			translation = context_translation;
		}
	}
	return translation;
}

exports.translate = function translate(msg, params, locale, catalogue) {
	if (typeof params == 'string') {
		if (typeof locale != 'undefined') {
			catalogue = locale;
		}
		locale = params;
		params = undefined;
	}
	// Find translation
	var translation = getTranslation(this, msg, locale || this.defaultLocale, catalogue || this.defaultCatalogue, params && params.context);
	var translated = typeof translation != 'undefined';
	// No translation found, just keep original message
	if (!translated) {
		translation = msg;
	}
	// Apply parameters
	translation = replaceParams(translation, params);
	// Debug ?
	if (!translated && this.debugInfo) {
		translation = this.debugInfo.prefix + translation + this.debugInfo.suffix;
	}
	return translation;
};

exports.plural = function plural(msg, number, params, locale, catalogue) {
	// Debug mode ?
	if (this.debugInfo) {
		this.pluralHandler.debug = true;
	}

	if (typeof params === 'string' && typeof locale === 'undefined') {
		locale = params;
		params = {};
	}

	if (!params) {
		params = {};
	}

	// Translate (only if all information provided, and no plural in store) ?
	if (!this.store.plural && (typeof params != 'undefined' || typeof locale != 'undefined' || typeof catalogue != 'undefined')) {
		msg = this.translate(msg, params, locale, catalogue);
	}
	// "number" can be a number (we'll replace "n" in this case), or an object like '{"count": 33}'
	var paramName = this.defaultPluralReplace;
	if (typeof number == 'object') {
		var foundKey = null;
		for (var p in number) {
			if (foundKey != null) {
				throw new Error('If you pass an object to plural(), it must have only ONE property.');
			}
			foundKey = p;
			number = number[p];
		}
		paramName = foundKey;
	}
	if (isNaN(number)) {
		throw new Error('plural() expects 2nd parameter to be a number.');
	}
	// Handle plural form
	if (this.store.plural) {
		// Skip generic plural forms handler, use the one embedded in store
		msg = this.store.plural(msg, number, locale || this.defaultLocale, catalogue || this.defaultCatalogue);
	} else {
		// Use generic plural forms handler, msg must have the required format
		msg = this.pluralHandler(msg, number);
	}
	// Replace in result
	var replacements = params;
	replacements[paramName] = String(number);
	return replaceParams(msg, replacements);
};

exports.dynamicHelpers = {
	"_":       function(req) { return function(msg, params, locale, catalogue) { return req.i18n.translate(msg, params, locale || req.locale(), catalogue); }; },
	"plural":  function(req) { return function(msg, number, params, locale, catalogue) { return req.i18n.plural(msg, number, params, locale, catalogue); }; },
	"locale":  function(req) { return req.locale(); },
	"locales": function(req) { return req.locales(); }
};

exports.debug = function debug(untranslatedPrefix, untranslatedSuffix) {
	if (typeof untranslatedSuffix == 'undefined' && untranslatedPrefix == false) {
		delete this.debugInfo;
	} else {
		this.debugInfo = {
			"prefix": (untranslatedPrefix == true ? undefined : untranslatedPrefix) || "[T]",
			"suffix": untranslatedSuffix || "[/T]"
		};
	}
};
