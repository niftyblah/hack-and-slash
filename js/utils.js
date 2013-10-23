// Underscore.js extend function ish
// extend(a, b);
// copies b values into a
extend = function(obj) {
	Array.prototype.slice.call(arguments, 1).forEach(function(source) {
		if (source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}
	});
	return obj;
};

// shim to enable Date.now on noob IE versions
if(!Date.now) {
	Date.now = function now() {
		return new Date().getTime();
	};
}

