
// var plural = require('plural-form');
// plural('[0]None|[1]One|[2-+Inf]More', 3); // 'More'
// plural('[0]None|{n%2==1}Odd|{n%2==0}Even', 3); // 'Odd'
// equivalents:
// plural([
//   {test:function(n){return n==0;},   text:"None"},
//   {test:function(n){return n%2==1;}, text:"Odd"},
//   {test:function(n){return n%2==0;}, text:"Even"}
// ], 3);
// plural([
//   [function(n){return n==0;},   "None"],
//   [function(n){return n%2==1;}, "Odd"],
//   [function(n){return n%2==0;}, "Even"]
// ], 3);
// plural(function(n){
//   if      (n == 0)   return "None";
//   else if (n%2 == 1) return "Odd";
//   else if (n%2 == 0) return "Even";
// }, 3);
module.exports = function pluralHandler(msg, n, throwError) {
	var forms;
	try {
		if (typeof msg == 'function') {
			return msg(n);
		}
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
		if (forms[i].test(n)) {
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
var ENCODED_SEPARATOR = '$$$SEPARATOR$$$';
var RE_ENCODED_SEPARATOR = /\$\$\$SEPARATOR\$\$\$/g;
var DECODED_SEPARATOR = '|';
// Cache calls to extractPluralForms()
var CACHE = {};

// Extract plural forms from a single string
// Accepts array of plural forms, or a list of plural forms in a single string, separated by '|'
// Returns {test: ruleCallback, text: ruleMessage}
function extractPluralForms(string) {
	// Allow array of plural forms
	if (string instanceof Array) {
		// Not detected a single plural form
		return string.map(extractPluralForm);
	}
	// Assume we have a string
	string = "" + string;
	// Get from cache
	if (typeof CACHE[string] != 'undefined') {
		return CACHE[string];
	}
	// Calculate
	string = string.replace(RE_ESCAPED_SEPARATOR, ENCODED_SEPARATOR); // Encode escaped separator
	return (CACHE[string] = string.split(RE_PLURAL_SEPARATOR).map(extractPluralForm).map(function(plural) {
		// Decode encoded escaped separator
		plural.text = plural.text.replace(RE_ENCODED_SEPARATOR, DECODED_SEPARATOR);
		return plural;
	}));
}
// Accepts array [ruleCallback, message] or [message, ruleCallback] or {text:message, test:ruleCallback} or 'rule message'
// Returns formatted rule: {text:message, test:ruleCallback}
function extractPluralForm(string) {
	// Check format: Array
	if (string instanceof Array) {
		if (typeof string[0] == 'function') {
			return {"text":string[1], "test":string[0]};
		} else if (typeof string[1] == 'function') {
			return {"text":string[0], "test":string[1]};
		} else {
			throw new Error("Invalid plural form as array");
		}
	}
	// Check format: direct object
	if (typeof string == 'object' && typeof string.test == 'function' && typeof string.text == 'string') {
		return string;
	}
	// Assume format: string
	string = "" + string;
	var match = RE_PLURAL_PART.exec(string);
	if (!match || (match[1] == '[' && match[3] != ']') || (match[1] == '{' && match[3] != '}')) {
		throw new Error("Invalid plural form: " + part);
	}
	return {
		"test": (match[1] == '[' ? extractPluralRuleCallbackRange : extractPluralRuleCallbackExpr)(match[2]),
		"text": match[4]
	};
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
	rule.split(RE_RANGES_SEPARATOR).forEach(function(s) {
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

// Generate callback for an "expr" rule
function extractPluralRuleCallbackExpr(rule) {
	return eval('(function(n){return Boolean(' + rule + ');})');
}
