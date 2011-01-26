var http = require('http'), plural = require('./plural-form');

exports.load = function load(catalogue, locales) {
	if (locales instanceof Array) {
		for (var i=0; i<locales.length; i++) {
			this.load(catalogue, locales[i]);
		}
	} else {
		this.store.load(catalogue || this.defaultCatalogue, locales || null, this);
	}
};

exports.configure = function configure(app, defaultLocale, loadedLocales, loadedCatalogue) {
	if (!defaultLocale) {
		defaultLocale = this.defaultLocale;
	}

	// Load i18n data
	this.load(loadedCatalogue || this.defaultCatalogue, loadedLocales);

	// Add helpers
	app.dynamicHelpers(this.dynamicHelpers);

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
		var current = req.session[module.exports.localeSessKey];
		if (typeof newValue != 'undefined') {
			req.session[module.exports.localeSessKey] = newValue;
		}
		if (typeof current == 'undefined' && typeof defaultLocale != 'undefined') {
			current = defaultLocale;
		}
		return current;
	};

	// Add "req.i18n.translate(...)" and "req.i18n.plural(...)"
	http.IncomingMessage.prototype.i18n = {
		"translate": this.translate,
		"plural":    this.plural,
	};
};

exports.localeSessKey = 'locale';
exports.store = require('./store-module');
exports.defaultLocale = 'en';
exports.defaultCatalogue = 'messages';
exports.defaultPluralReplace = '%n%';

exports.translate = function translate(msg, params, locale, catalogue) {
	if (typeof params == 'string') {
		if (typeof locale != 'undefined') {
			catalogue = locale;
		}
		locale = params;
		params = undefined;
	}
	// Find translation
	var translation = this.store.get(msg, locale || this.defaultLocale, catalogue || this.defaultCatalogue, this);
	var translated = typeof translation != 'undefined';
	if (!translated) {
		translation = msg;
	}
	// Apply parameters
	if (typeof params == 'object') {
		for (var replace in params) {
			translation = translation.replace(replace, params[replace]);
		}
	}
	// Debug ?
	if (!translated && this.debugInfo) {
		translation = this.debugInfo.prefix + translation + this.debugInfo.suffix;
	}
	return translation;
};

exports.plural = function plural(msg, number, params, locale, catalogue) {
	// Translate ?
	if (typeof params != 'undefined' || typeof locale != 'undefined' || typeof catalogue != 'undefined') {
		msg = this.translate(msg, params, locale, catalogue);
	}
	// "number" can be a number (we'll replace "%n%" in this case), or an object like '{"%count%": 33}'
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
	// FIXME handle plural form
	// msg = ...
	// Replace in result
	return msg.replace(paramName, number);
};

exports.dynamicHelpers = {
	"_":       function(req) { return function(msg, params, locale, catalogue) { return req.i18n.translate(msg, params, locale || req.locale(), catalogue); }; },
	"plural":  function(req) { return function(msg, number, params, locale, catalogue) { return req.i18n.plural(msg, number, params, locale, catalogue); }; },
	"locale":  function(req) { return req.locale(); },
	"locales": function(req) { return req.locales(); },
};

exports.debug = function debug(untranslatedPrefix, untranslatedSuffix) {
	if (typeof untranslatedSuffix == 'undefined' && untranslatedPrefix == false) {
		delete this.debugInfo;
	} else {
		this.debugInfo = {
			"prefix": untranslatedPrefix || "[T]",
			"suffix": untranslatedSuffix || "[/T]",
		};
	}
};
