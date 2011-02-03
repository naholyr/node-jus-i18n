
var options = {
	"paths": [ process.cwd() + "/i18n-data" ],
	"encoding": "utf8"
},
data = {},
FS = require("fs"),
Path = require("path");

function readdirs(paths, callback) {
	setTimeout(function() {
		var files = [], error = undefined;
		paths.forEach(function(path) {
			if (error) return;
			try {
				var path_files = FS.readdirSync(path);
				path_files.forEach(function(file) {
					files.push(Path.join(path, file));
				});
			} catch (e) {
				if (e instanceof Error && e.errno == 2) { // Not found
					// Ignore error
				} else {
					error = e;
				}
			}
		});
		callback(error, files);
	}, 0);
}

function glob(paths, re, callback) {
	if (!(paths instanceof Array)) {
		paths = [paths];
	}
	readdirs(paths, function(err, files) {
		if (err) {
			callback(err);
		} else {
			callback(undefined, files.filter(function(file) {
				return re.test(file);
			}));
		}
	});
}

function loadFiles(files) {
	return files.map(loadFile);
}

function loadFile(file) {
	var parts = Path.basename(file).split(/\./);
	if (parts.length >= 3) {
		var catalogue = parts[0], locale = parts[1];
		if (typeof data[catalogue] == 'undefined') {
			data[catalogue] = {};
		}
		if (typeof data[catalogue][locale] == 'undefined') {
			data[catalogue][locale] = {};
		}
		translations = data[catalogue][locale];
		var content = FS.readFileSync(file, options.encoding);
		content.split(/[\r\n]+/).forEach(function(line) {
			var trans = line.split("="), source = trans.shift(), target = trans.join("=");
			if (target) {
				source = source.replace(/^\s*(["']?)(.*?)\1\s*$/, '$2');
				target = target.replace(/^\s*(["']?)(.*?)\1\s*$/, '$2');
				translations[source] = target;
			}
		});
		return locale;
	}
}

exports.load = function load(catalogue, locales, i18n, callback) {
	if (typeof locales == 'undefined') {
		// No locales: load by catalogue
		glob(options.paths, new RegExp("\/"+catalogue.toLowerCase()+"\.[a-z\-_]+\.[a-z0-9\-_]+$", "i"), function(err, files) {
			var locales, error;
			try {
				locales = loadFiles(files);
			} catch (e) {
				error = e;
			}
			callback(error, locales, this);
console.log(data);
		});
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
	return ((data[catalogue] || {})[locale] || {})[key];
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
