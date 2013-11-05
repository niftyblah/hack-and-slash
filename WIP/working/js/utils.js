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

// https://gist.github.com/gordonbrander/2230317
ID = function() {
	return '_' + Math.random().toString(36).substr(2, 9);
};

// create a 2d array of size Size
get2DArray = function(size) {
	size = size > 0 ? size : 0;
	var arr = [];

	while(size--) {
		arr.push([]);
	}

	return arr;
}

