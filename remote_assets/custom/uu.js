/*
	uniquely unique
*/
var uu = new Object();

// unique id from string
uu.str_uid = function(str) {
	// simple
	str = str.replace(/[^A-Za-z0-9]/g, '');
	// unique
	var hash = 0;
	if (str.length == 0) {
		return hash;
	}
	for (i = 0; i < str.length; i++) {
		char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	// ok
	return str.substr(0,30) + hash;
};

// random id, most likely unique
uu.random_uid = function(length) {
	length = parseInt(length);
	if (!length) {
		length = 11;
	}
	var text = "";
	var possible = "abcdefghijklmnopqrstuvwxyz";
	text += possible.charAt(Math.floor(Math.random() * possible.length));
	possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (i = 1; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

// object to query, not including the leading "?"
uu.to_query_string = function(obj) {
	var parts = [];
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
		}
	}
	return parts.join("&");
};

// pad number
uu.pad = function(number, digits) {
	return number.toString().length < (digits||2) ? "0" + str.toString() : str;
}

// trim whitespace before/after
uu.trim = function(str){
	str = str.replace(/(^[^a-zA-Z0-9\(\)]*)|([^a-zA-Z0-9\(\)]*$)/g, '');
	return str;
};

// t.b.d.
uu.strip_tags = function(input, allowed) {
	allowed = (((allowed || '') + '')
			.toLowerCase()
			.match(/<[a-z][a-z0-9]*>/g) || [])
		.join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)

	var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
		commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;

	return input.replace(commentsAndPhpTags, '')
		.replace(tags, function($0, $1) {
			return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
		});
};

// to make easier to read at first glance, removes cyclic values
// 1 level deep
uu.stringify_simple = function(_in) {
	// ...
	var _out = [];
	var _i = 0;
	// array
	if (typeof _in === 'object') {
		for (_i in _in) {
			if (_in.hasOwnProperty(_i)) {
				_out.push([_i, _in[_i] + '']);
			}
		}
		// undefined
	} else if (_in === undefined) {
		_out = 'undefined';
		// null
	} else if (_in === null) {
		_out = 'null';
		// string
	} else {
		_out = _in + '';
	}
	// ...
	return JSON.stringify(_out,null,'\t');
};
// 2 levels deep
uu.stringify_double = function(_in) {
	// ...
	var _out = [];
	var _i = 0;
	// array
	if (typeof _in === 'object') {
		for (_i in _in) {
			if (_in.hasOwnProperty(_i)) {
				_out.push([_i, uu.consoleSimpleArray(_in[_i])]);
			}
		}
		// undefined
	} else if (_in === undefined) {
		_out = 'undefined';
		// null
	} else if (_in === null) {
		_out = 'null';
		// string
	} else {
		_out = _in + '';
	}
	// ...
	return JSON.stringify(_out,null,'\t');
};


// Dom<->Html (not quite ready)
// html2dom = function(html) {
// 	var parser = new DOMParser();
// 	return parser.parseFromString(html, "text/html");
// },
// dom2html = function(dom) {
// 	var target = document.getElementById(dom);
// 	var wrap = document.createElement('div');
// 	wrap.appendChild(target.cloneNode(true));
// 	return wrap.innerHTML;
// },


