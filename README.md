[![Build Status](https://secure.travis-ci.org/naholyr/node-jus-i18n.png)](http://travis-ci.org/naholyr/node-jus-i18n)

Usage
=====

Default usage
-------------

```javascript
// Load module:
var i18n = require('/path/to/i18n');
// Optional: set default locale
i18n.defaultLocale = 'fr';
// Optional: add prefix and suffix around untranslated strings (default = '[T]' and '[/T]'
i18n.debug();
// Mandatory: load translation data
i18n.load(
  catalogue, // Catalogue to load, undefined if you want to load default catalogue
  locales,   // array of locales to load, undefined if want to load all available locales
  function(errors, loadedLocales, store) { // Callback
    // errors = hash of exceptions thrown by each erroneous locale, or undefined if no error
    //          any global error will be stored in errors.ALL
    // loadedLocales = array of successfully loaded locales
    // store = store module
  }
);
// Go translate :)
console.log(i18n.translate('Chicken')); // "Poulet"
console.log(i18n.translate('Chicken', 'it')); // "Pollo"
console.log(i18n.translate('Chicken {name}', {name: "KFC"})); // "Poulet KFC"
console.log(i18n.translate('Chicken {name}', {name: "KFC"}, 'it')); // "Pollo KFC"
```

Integration with Express.js
---------------------------

```javascript
// ... app initialized ...
// Load module:
var i18n = require('/path/to/i18n');
// Optional: configure default locale, debug mode, etc.
// Then configure application:
app.configure(function() {
  i18n.enableForApp(app, { // options (all are optional, you can pass {} or undefined
    "locale": "en",          // default locale
    "catalogue": "messages", // catalogue to load
    "locales": undefined,    // locales to load
  }, function(err) { // called when i18n has loaded messages
    ...
  });
});
// Your "req" object is augmented:
req.i18n.translate(...)
req.locales() // returns the list of user's accept-language, ordered by preference
req.locale() // returns current user's chosen locale, stored in session if available
// Your templates gain new helpers:
...<%= _('Hello, {name}', {name: userName}) %>...
...<%= plural('You have {n} messages', nbMessages) %>...
```

Store your messages
===================

There are multiple message stores currently supported, details for which are provided below.

Store: module
-------------

A whole catalogue in a single file:

```javascript
// Module name: "./i18n-data/%catalogue%"
// ./i18n-data/messages.js
module.exports = {
  "fr": { "Chicken": "Poulet", "Chicken {name}": "Poulet {name}" },
  "it": { "Chicken": "Pollo", "Chicken {name}": "Pollo {name}" },
};
// will be loaded with i18n.load('messages');
```

Or split by locale:

```javascript
// Module name: "./i18n-data/%catalogue%/%locale%"
// ./i18n-data/messages/fr.js
module.exports = { "Chicken": "Poulet", "Chicken %name%": "Poulet %name%" };
// ./i18n-data/messages/it.js
module.exports = { "Chicken": "Pollo", "Chicken %name%": "Pollo %name%" };
// will be loaded with i18n.load('messages', ['fr', 'it']);
```

Note that you can customize the path to i18n-data modules:

```javascript
i18n.i18nDataModuleName.__default__ = process.cwd() + "/i18n-data";
```

This method is the most flexible, faster than other file storage, and therefore ideal to embed your translations in your application.
Nevertheless, there is an important drawback using module storage: not the same file will be loaded, depending on the way you call "i18n.load(...)".
The best way to store your messages using module storage, to keep full compatibility with any "load(...)" parameters, is to declare your catalogue, that will include all locales:

```javascript
// ./i18n-data/messages/index.js
module.exports = {
  "fr": require('./fr'),
  "it": require('./it')
};
// ./i18n-data/messages/fr.js
module.exports = { "Chicken": "Poulet", "Chicken %name%": "Poulet %name%" };
// ./i18n-data/messages/it.js
module.exports = { "Chicken": "Pollo", "Chicken %name%": "Pollo %name%" };
i18n.load('messages') and i18n.load('messages', ['fr', 'it']) will both work
```

In this storage engine, methods to list available locales will not respond.

### Formats, contexts and plural forms

Default format:

    "sentence": "Translated sentence",

Context embedded in the message:

    "sentence": "Translated sentence for default context or no context",
    "context1:sentence": "Translation for context1",
    "context2:sentence": "Translation for context2",
    ...

Using callback:

    "sentence": function(context) {
      switch (context) {
        ...
        default:
          return "Default translation";
      }
    }

Using hash:

    "sentence": {
      "": "Default translation",
      "context1": "Translation for context1",
      "context2": "Translation for context2",
      ...
    }

Of course, a "translation" can be a simple string as any representation of a plural form (string, array, hash).

Mixing plural forms and contexts can be confusing, the best practice is not to use numbers as context. 

Store: file
-----------

Filename: i18n-data/messages.{lang}[.txt]

You can specify several folders, translations will then be merged, in the same order the folders have been declared (last one overrides previous).

Format:

    sentence = translation

* Surrounding quotes (single or double) can be used, they'll be stripped out.

    sentence = "translation"
    sentence = 'translation'

* Escape using backslash.

    sentence = "my \"translation\""

* Same rules apply to keys, if you need to use a "=" in a key, quote it or escape the sign

    "my \= sentence" = "my = translation"

### Plural forms

Default format:

    You have {n} messages = [0]Vous n'avez aucun message|[1]Vous avez un message|[2-+Inf]Vous avez {n} messages

Multiline format (use a single pipe, then one plural form per line, indented by one or more spaces/tabs):

    You have {n} messages = |
    	[0]Vous n'avez aucun message
    	[1]Vous avez un message
    	[2-+Inf]Vous avez {n} messages

### Contexts

Default format:

    Hello, {name} = Bonjour, {name}
    female:Hello, {name} = Bonjour, mademoiselle {name}
    male:Hello, {name} = Bonjour, monsieur {name}

Multiline format (define default translation, then one translation per context, using colon):

    Hello, {name} = Bonjour, {name}
    	female: Bonjour, mademoiselle {name}
    	male: Bonjour, monsieur {name}

If you need to use a single pipe as default translation, this will trigger plural forms (and then a syntax error) unless you quote it or escape it. 

Store: gettext
--------------

The hierarchy is fully similar with the file storage, except that files are expected to end with ".po".

This store uses Javascript implementation of Gettext, and interprets directly ".po" files. No need to compile.

The PO format won't be described here, use it as expected :) Some notes though:

* Generic plural forms handler implemented by jus-i18n is not used here, we directly use gettext's one.
* Plural forms API in jus-i18n expects only one parameter "msg". If your `msgid` and `msgid_plural` values are not the same in your PO file, then you'll simply have to provide an array `[msgid, msgid_plural]`.
* Contexts are supported by gettext, but jus-i18n context handling will still be used. This is expected to change.

Store: db
---------

Soon available (redis, mongodb, mysql...).

Plural forms
============

TODO documentation.

This is the most important feature to come. Still in development though.

Planned API (WiP)
-----------------

The base function will expect only the "plural form", and the associated number:

    plural(msg, number)

A "plural form" could be a simple string, or a complex structure.
Here are some valid formats we could imagine:

    // Simple string
    "[0]No message|[1]One message|[2,+Inf)%count% messages"

    // Complex structure
    [
      [ function(count){return count == 0;}, "No message" ],
      [ function(count){return count == 1;}, "One message" ],
      [ function(count){return count >= 2;}, "%count% messages" ],
    ]

Supporting both type of structures could ease support for complex rules like polish plurals (where we need to use euclidian divides). Eval() is an option too...

About translating message passer to `plural()`, following behavior has to be discussed:

> "plural()" is able to automatically translate the message, BUT ONLY IF YOU EXPECT IT TO:
> 
> * plural(msg, number) → will not translate msg
> * plural(msg, number, params, locale, catalogue) → will translate msg
> 
> If you want "plural()" to translate the message, but using default locale and no replacement, then call `plural(msg, number, {})`
> 
> Other option: always translate.

Example in a template:

    <%= plural("You have %n% messages", 3, {}) %>
    // _("You have %n% messages") returns "[0]No message|[1]One message|[2,+Inf)%n% messages"
    // plural("[0]No message|[1]One message|[2,+Inf)%n% messages", 3) returns "3 messages"

Contextual translations
=======================

You may sometimes need to translate a sentence differently depending on a unpredictible context. Usual case is the gender (male/female).
This is handled using a special parameter named "context", and a special translation "context:message".

For example, supposing you want to say "hello, {name}" differently depending on civility ("mr", "mrs", "miss"), you will provide these translations in the store:

    {
      "hello, {name}": "hello, {name}",                  // default translation, no context
      "mr:hello, {name}": "hello, Mister {name}",        // translation for civility "mr"
      "mrs:hello, {name}": "hello, Mrs. {name}",         // translation for civility "mrs"
      "miss:hello, {name}": "hello, Miss {name}"         // translation for civility "miss"
    }

You will then be able to translate "hello, {name}" differently depending on provided context:

    i18n.translate("hello, {name}", {name: "Jones", context: "mr"});  // hello, Mister Jones
    i18n.translate("hello, {name}", {name: "Jones", context: "mrs"}); // hello, Mrs. Jones

Configuration
=============

* Customize the session key to store user's locale:
  
      i18n.localeSessKey = 'locale';

* Customize the messages store:
  
      // Embedded store
      i18n.setStore('module', options, function(err, i18n) {
        ...
      });
      // You custom store module
      i18n.setStore(require('/path/to/my/store'), options, function(err, i18n) {
        ...
      });
  
  Beware you must call "i18n.load(...)" again if you had already loaded another store.
  You can use only one store at a time.

* Customize default locale:
  
      i18n.defaultLocale = 'en';

* Default catalogue to load and search translations from:
  
      i18n.defaultCatalogue = 'messages';

* Change format of replaced parameters in your messages:
  
      i18n.replaceFormat = '{...}';
      // i18n.replaceFormat = ':...';
      // and i18n.translate('hello, :name', {name: 'John'}) will work as expected

* In plural forms, the parameter 'n' is replaced by the number, you can change this name:
  
      i18n.defaultPluralReplace = 'n';

Write your own store
--------------------

You must write a module that will expose at least two self-explanatory methods:

* load(catalogue, locales, i18n, callback)
  * catalogue and i18n will always be provided by i18n module.
  * if no locale is provided, you're expected to enable all available locales.
  * callback expects following parameters: (errors, loadedLocales, this)
* get(key, locale, catalogue, i18n)
  * all parameters will always be provided by i18n module.
  * if no translation is found, you MUST return undefined.
  * this function HAS TO BE synchronous.
* locales(prefix, callback)
  * callback expects following parameters: (err, array of locales starting with prefix, this)
* catalogues(callback)
  * callback expects following parameters: (err, array of available catalogues, this)
* configure(options, callback)
  * configure the store, options depend on your store
  * callback expects following parameters: (err, this)

The i18n module is passed to these methods whenever you would need it in your store.

Stupid example (will always translate "js", and only this one, into "rox"):

    var data = {};
    exports.load = function(catalogue, locale, i18n, callback) {
      catalogue = catalogue || i18n.defaultCatalogue;
      locale = locale || i18n.defaultLocale;
      if (!data[catalogue]) {
        data[catalogue] = {locale: {"js": "rox"}};
      } else {
        if (!data[catalogue][locale]) {
          data[catalogue][locale] = {"js": "rox"};
        } else {
          data[catalogue][locale]["js"] = "rox";
        }
      }
      // Make it asynchronous
      setTimeout(function() { callback(undefined, i18n, exports); }, 1);
    }
    exports.get = function(key, locale, catalogue) {
      return data[catalogue][locale][key];
    }
    exports.configure = function(options, callback) {
      // This time, it's synchronous, your implementation, your choice
      callback(undefined, i18n, this);
    }

TODO
====

* Fix the data loading when we specify the list of loaded locales.
* Provide more stores (at least Redis).
* Better documentation.
* If provided a "file" store: Ability to merge data from more than one folder.
* Ability to use more than one store at same time.
* Better support for locales "lang_COUNTRY" (loads messages for locales "lang" and "lang-country").
* All these things I didn't think about yet.

---

* Done: <del>Plural forms, including ranges and expressions recognition</del>.
* Done: <del>Context like gender (original idea from dialect)</del>.
