const gettext = require('../node_modules/gettext');
var options = exports.options = {
	"paths": [ process.cwd() + "/i18n-data" ],
	"pattern": /([a-z0-9\-_]+)\.([a-z\-_]+)\.[a-z]+$/i,
	"patternIndexCatalogue": 1,
	"patternIndexLocale": 2
};

const fs = require('fs');
const path = require('path');


function loadFile(file, callback) {
	var m = file.match(options.pattern);
	if (m) {
		var catalogue = m[options.patternIndexCatalogue];
		var locale = m[options.patternIndexLocale];
		if (typeof data[catalogue] == 'undefined') {
			data[catalogue] = {};
		}
		if (typeof data[catalogue][locale] == 'undefined') {
			data[catalogue][locale] = {};
		}
		var translations = data[catalogue][locale];
		fs.readFile(file, options.encoding, function(err, content) {
			if (!err) content.split(/[\r\n]+/).forEach(function(line) {
				var trans = line.split("="), source = trans.shift(), target = trans.join("=");
				if (target) {
					source = source.replace(/^\s*(["']?)(.*?)\1\s*$/, '$2');
					target = target.replace(/^\s*(["']?)(.*?)\1\s*$/, '$2');
					translations[source] = target;
				}
			});
			callback(err, locale);
		});
	}
}

exports.load = function load(catalogue, locales, i18n, callback) {
	var self = this;
	readdir.glob(options.paths, options.pattern, function(err, files, matches) {
		if (err) callback(err, [], self);
		else {
			var items = [];
			files.forEach(function(f, i) {
				if (locales && locales.indexOf(matches[i][options.patternIndexLocale]) == -1) return;
				if (matches[i][options.patternIndexCatalogue] != catalogue) return;
				items.push([f, catalogue, matches[i][options.patternIndexLocale]]);
			});
			var locales = [];
			// Call "gettext.loadLanguageFile" on every file found
			async.map(items,
				function(item, cb) { gettext.loadLanguageFile(item[0], item[2], function(err) { cb(err, item) }) },
				function(item) { locales.push(item[2]) },
				function(err) {	callback(err, locales, self) });
		}
	});
};

exports.get = function get(key, locale, catalogue) {
	gettext.setlocale('LC_ALL', locale);
	return gettext.dgettext(catalogue, key);
};

exports.configure = function configure(options, callback) {
	if (typeof options != 'object') {
		return callback(new Error('Invalid options'), this);
	}
	for (var option in newOptions) {
		options[option] = newOptions[option];
	}
	return callback(undefined, this);
};

exports.locales = function locales(prefix, catalogue, callback) {
	return callback(new Error('Not implemented yet'));
};

exports.catalogues = function catalogues(callback) {
	return callback(new Error('Not implemented yet'));
};

/**
 * @param Array|String msg Can be the message, or a couple [msg, msg_plural]
 */
exports.plural = function(msg, number, locale, catalogue) {
	var msg_plural;
	if (msg instanceof Array) {
		msg_plural = msg[1];
		msg = msg[0];
	} else {
		msg_plural = msg;
	}
	gettext.setlocale('LC_ALL', locale);
	return gettext.dngettext(catalogue, msg, msg_plural, number);
};
