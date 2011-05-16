/**
 * Executes async function on a list of items, and executes passed callback only when all async calls are finished, or as soon
 * as one call failed. One fail breaks the whole chain, and you won't get the other results.
 *
 * @param Array items The list of items to call async function on.
 * @param Function exec The async function to be called on each item.
 * @param Function execCallback The callback called by exec, but without the "error" first parameter (as it can't be erronous at this point).
 * @param Function finalCallback The callback we call when all execs are done. It expects only one parameter (error).
 */
exports.map = function map(items, exec, execCallback, finalCallback) {
	var error = undefined;
	var done = 0;
	function markDone() {
		done++;
	}
	function execOnItem(item) {
		exec.call(items, item, function(err) {
			if (!isDone()) {
				if (err) error = err;
				else {
					var args = [].slice.call(arguments, 1);
					args.unshift(item);
					execCallback.apply(item, args);
					markDone();
				}
			}
		});
	}
	function isDone() {
		return done == items.length || error !== undefined;
	}
	function checkDone() {
		if (isDone()) finalCallback.call(items, error);
		else setTimeout(checkDone, 1);
	}
	items.forEach(execOnItem);
	checkDone();
};
