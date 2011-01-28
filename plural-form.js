
// var plural = require('plural-form');
// plural('[0]None|[1]One|[2-+Inf]More', 3); // 'More'
// plural('[0]None|{n%2=1}Odd|{n%2=0}Even', 3); // 'Odd'
module.exports = function pluralHandler(msg, number, throwError) {
	var forms;
	try {
		forms = extractPluralForms(msg);
	} catch (e) {
		if (exports.debug) {
			console.debug(e);
		}
		if (throwError) {
			throw e;
		}
		return msg;
	}
	for (var i=0; i<forms.length; i++) {
		if (forms[i].test(number)) {
			return forms[i].text;
		}
	}
};
exports.debug = false;

// Match a part of a plural form
var RE_PLURAL_PART = /^\s*([\[\{])([^\[\]]+)([\]\}])(.*)\s*$/;
// Plural forms separated by '|'
var RE_PLURAL_SEPARATOR = /\|/g;
// Escape '|' using '||'
var RE_ESCAPED_SEPARATOR = /\|\|/g;
var ENCODED_SEPARATOR = '||.';
var RE_ENCODED_SEPARATOR = /\|\|\./g;
var DECODED_SEPARATOR = '|';
// Cache calls to extractPluralForms()
var CACHE = {};

// Extract plural forms from a single string
function extractPluralForms(string) {
	if (typeof CACHE[string] != 'undefined') {
		return CACHE[string];
	}
	string = string.replace(RE_ESCAPED_SEPARATOR, ENCODED_SEPARATOR);
	var result = [];
	string.split(RE_PLURAL_SEPARATOR).forEach(function(part) {
		var match = RE_PLURAL_PART.exec(part);
		if (!match || (match[1] == '[' && match[3] != ']') || (match[1] == '{' && match[3] != '}')) {
			throw new Error("Invalid plural form: " + part);
		}
		result.push({
			"test": (match[1] == '[' ? extractPluralRuleCallbackRange : extractPluralRuleCallbackExpr)(match[2]),
			"text": match[4].replace(RE_ENCODED_SEPARATOR, DECODED_SEPARATOR)
		});
	});
	CACHE[string] = result;
	return result;
}

// Generate callback for a "range" rule
var RE_RANGES_SEPARATOR = /\s*,\s*/;
var RE_RANGE = /(-Inf|\+Inf|[0-9]+)(?:\s*-\s*(-Inf|\+Inf|[0-9]+))?/i;
function toNumber(s) {
	if (s.toLowerCase() == '-inf') {
		return Number.NEGATIVE_INFINITY;
	} else if (s.toLowerCase() == '+inf') {
		return Number.POSITIVE_INFINITY;
	} else {
		var n = parseInt(s, 10);
		if (isNaN(n)) {
			throw new Error("Invalid number: " + s);
		}
		return n;
	}
}
function extractPluralRuleCallbackRange(rule) {
	var ranges = [];
	r.split(RE_RANGES_SEPARATOR).forEach(function(s) {
		var match = RE_RANGE.exec(s);
		if (!match) {
			throw new Error("Invalid range: " + s);
		}
		var min = toNumber(match[1]), max = match[2];
		if (typeof max == 'undefined') {
			ranges.push(min);
		} else {
			ranges.push([min, toNumber(max)]);
		}
	});
	return function checkRange(n) {
		for (var i=0; i<ranges.length; i++) {
			if ((typeof ranges[i] == 'number' && n == ranges[i]) || (ranges[i][0] <= n && n <= ranges[i][1])) {
				return true;
			}
		}
		return false;
	};
}

// TODO Generate callback for an "expr" rule
function extractPluralRuleCallbackExpr(rule) {
	return function(n) {
		throw new Error("Not Implemented Yet");
	};
}
