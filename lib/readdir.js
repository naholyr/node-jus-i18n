const fs = require('fs');
const path = require('path');
const async = require('./async');

const readdirs = exports.readdirs = function readdirs(dirs, callback) {
	var files = [];
	async.map(dirs,
		fs.readdir,
		function(dir, dirFiles) {
			dirFiles.forEach(function(file) {
				files.push(path.join(dir, file));
			});
		},
		function(err) {
			callback(err, files);
		}
	);
};

const glob = exports.glob = function glob(paths, re, callback) {
	if (!(paths instanceof Array)) {
		paths = [paths];
	}
	readdirs(paths, function(err, files) {
		if (err) callback(err);
		else {
			var matchingFiles = [];
			var matches = [];
			files.forEach(function(file) {
				var m = file.match(re);
				if (m) {
					matches.push(m);
					matchingFiles.push(file);
				}
			});
			callback(err, matchingFiles, matches);
		}
	});
};



if (require.main === module) {
	// Simple test when executed directly
	readdirs(['../test/i18n-data', '.', '../stores'], function(err, files) {
		console.log('readdirs', files);
	});
	glob(['../test/i18n-data', '.', '../stores'], /\.js$/, function(err, files) {
		console.log('glob', files);
	});
}
