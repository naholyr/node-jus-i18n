var RE_MESSAGE = /^((?:\[[^\[\]]+\])|(?:\{[^\{\}]+\}))(.*?)(\|(?:(?:\[[^\[\]]+\])|(?:\{[^\{\}]+\})).*)?$/g;

// Plural forms separated by '|'
var RE_PLURAL_SEPARATOR = /\|/g;

// Escape '|' using '||'
var RE_ESCAPED_SEPARATOR = /\|\|/g;
var ENCODED_SEPARTOR = '||.';
var RE_ENCODED_SEPARATOR = /\|\|\./g;
var DECODED_SEPARATOR = '|';

// Extract plural forms from a single string
var extractPluralForms = function extractPluralForms(string) {
	string = string.replace(RE_ESCAPED_SEPARATOR, ENCODED_SEPARATOR);
	
}

module.exports = function pluralHandler(msg, number) {
	return msg;
};
