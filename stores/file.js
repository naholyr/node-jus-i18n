const readdir = require('../lib/readdir');
const async = require('../lib/async');
const fs = require('fs');
const path = require('path');

var options = {
	"paths": [ path.join(process.cwd(), 'i18n-data') ],
	"encoding": 'UTF-8',
	"pattern": /([a-z0-9\-_]+)\.([a-z\-_]+)\.[a-z]+$/i,
	"patternIndexCatalogue": 1,
	"patternIndexLocale": 2
};
var data = {};

function listCatalogueFiles(catalogue, callback) {
	readdir.glob(options.paths, options.pattern, function(err, files, matches) {
		if (err) callback(err);
		else {
			var catalogueFiles = [];
			var catalogueMatches = [];
			files.forEach(function(file, i) {
				if (matches[i][options.patternIndexCatalogue] == catalogue) {
					catalogueFiles.push(file);
					catalogueMatches.push(matches[i]);
				}
			});
			callback(err, catalogueFiles, catalogueMatches);
		}
	});
}

function loadFiles(files, callback) {
	var locales = [];
	async.map(files, loadFile, function(file, locale) { locales.push(locale) }, function(err) { callback(err, locales) });
}

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
	listCatalogueFiles(catalogue, function(err, files, matches) {
		if (err) callback(err, [], self);
		else {
			if (typeof locales != 'undefined') {
				files = files.filter(function(f, i) { locales.indexOf(matches[i][options.patternIndexLocale]) != -1 });
			}
			loadFiles(files, function(err, locales) { callback(err, locales, self) });
		}
	});
};

exports.get = function get(key, locale, catalogue) {
	return ((data[catalogue] || {})[locale] || {})[key];
};

exports.configure = function configure(newOptions, callback) {
	if (typeof options != 'object') {
		return callback(new Error('Invalid options'), this);
	}
	for (var option in newOptions) {
		options[option] = newOptions[option];
	}
	return callback(undefined, this);
};

exports.locales = function locales(prefix, catalogue, callback) {
	function hasPrefix(locale) {
		return locale && (locale.substring(0, prefix.length) == prefix);
	}
	listCatalogueFiles(catalogue, function(err, files, matches) {
		if (err) callback(err);
		else {
			var allLocales = [];
			files.forEach(function(file, i) {
				var locale = matches[i][options.patternIndexLocale];
				if (hasPrefix(locale) && allLocales.indexOf(locale) == -1) allLocales.push(locale);
			});
			callback(err, allLocales);
		}
	});
};

exports.catalogues = function catalogues(callback) {
	readdir.glob(options.paths, options.pattern, function(err, files, matches) {
		if (err) callback(err);
		else {
			var catalogues = [];
			matches.forEach(function(match) {
				var catalogue = match[options.patternIndexCatalogue];
				if (catalogues.indexOf(catalogue) == -1) catalogues.push(catalogue);
			});
			callback(err, catalogues);
		}
	});
};
