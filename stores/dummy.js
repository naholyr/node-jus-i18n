
exports.load = function load(catalogue, locales, i18n, callback) {
	// Too dumb to load anything
	if (typeof locales == 'undefined') {
		// No locales: load by catalogue
		return callback({'ALL':new Error('Too dumb to load a catalogue')}, undefined, this);
	} else {
		// Load specified locales
		var errors = {};
		locales.forEach(function(locale) {
			errors[locale] = new Error('Too dumb to load locale ' + locale);
		});
		errors.ALL = new Error('Too dumb to load anything');
		callback(errors, [], this);
	}
};

exports.get = function get(key, locale, catalogue) {
	// Too dumb to have stored anything
	return undefined;
};

exports.configure = function configure(options, callback) {
	// Too dumb to be configured
	if (typeof options != 'object') {
		return callback(new Error('Invalid options'), this);
	}
	return callback(undefined, this);
};

exports.locales = function locales(prefix, catalogue, callback) {
	// Too dumb...
	return callback(new Error('Too dumb to know what locales I can load'), undefined, this);
};

exports.catalogues = function catalogues(callback) {
	// Too dumb...
	return callback(new Error('Too dumb to know what catalogues I can load'), undefined, this);
};

/*
 * Plural forms
 *
 * exports.plural = function(msg, number, locale, catalogue) {
 *	// If I support plural forms, this method will be called instead of the generic one
 * }
 */
