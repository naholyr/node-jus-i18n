Usage
=====

In any type of application:

    // Load module:
    var i18n = require('/path/to/i18n');
    // Optional: set default locale
    i18n.defaultLocale = 'fr';
    // Optional: add prefix and suffix around untranslated strings (default = '[T]' and '[/T]'
    i18n.debug();
    // Mandatory: load translation data
    i18n.load(); // You can specify the only locales you want to load
    // Go translate :)
    console.log(i18n.translate('Chicken')); // "Poulet"
    console.log(i18n.translate('Chicken', 'it')); // "Pollo"
    console.log(i18n.translate('Chicken %name%', {"%name%": "KFC"})); // "Poulet KFC"
    console.log(i18n.translate('Chicken %name%', {"%name%": "KFC"}, 'it')); // "Pollo KFC"

In Express.js:

    // ... app initialized ...
    // Load module:
    var i18n = require('/path/to/i18n');
    // Optional: configure default locale, debug mode, etc.
    // Then configure application:
    app.configure(function() {
      i18n.configure(app);
    });
    // Your "req" object is augmented:
    req.i18n.translate(...)
    req.locales() // returns the list of user's accept-language, ordered by preference
    req.locale() // returns current user's chosen locale, stored in session if available
    // Your templates gain new helpers:
    ...<%= _('You have :nb: messages', {":nb:": 3}) %>...

Store your messages
===================

There is only one messages store currently supported is "store-module", which means you store your messages as a Node.js module.

Samples:

    // Module name: "./i18n-data/%catalogue%"
    // ./i18n-data/messages.js
    module.exports = {
      "fr": { "Chicken": "Poulet", "Chicken %name%": "Poulet %name%" },
      "it": { "Chicken": "Pollo", "Chicken %name%": "Pollo %name%" },
    };

Note that you can customize the path to i18n-data modules:

    i18n.i18nDataModuleName.__default__ = process.cwd() + "/i18n-data";

Plural forms
============

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

Configuration
=============

* Customize the session key to store user's locale:
     i18n.localeSessKey = 'locale';
* Customize the store:
     i18n.store = require('/path/to/my-store');

Write your own store
--------------------

You must write a module that will expose at least two self-explanatory methods:
* load(catalogue, locale, i18n)
  * catalogue and i18n will always be provided by i18n module.
  * if no locale is provided, you're expected to enable all locales.
* get(key, locale, catalogue, i18n)
  * all parameters will always be provided by i18n module.
  * if no translation is found, you're expected to return null, false, or undefined.

The i18n module is passed to these methods whenever you would need it in your store.

Stupid example (will always provide a translation for "js"):

    var data = {};
    exports.load = function(catalogue, locale, i18n) {
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
    exports.get = function(key, locale, catalogue) {
      return data[catalogue][locale][key];
    }

TODO
====

* Plural forms
* Fix the data loading when we specify the list of loaded locales
* Provide more stores (at least Redis)
* Better documentation
* If provided a "file" store: Ability to merge data from more than one folder
* All these things I didn't think about yet
