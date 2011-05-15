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
