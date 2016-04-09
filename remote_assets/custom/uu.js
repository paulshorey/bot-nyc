/*
	uniquely unique
*/
var uu = new Object();

// Not sure if this just removes special characters, or actually makes a hash
// uu.str_id = function(str) {
// 	// unique
// 	var hash = 0;
// 	if (str.length == 0) {
// 		return hash;
// 	}
// 	for (i = 0; i < str.length; i++) {
// 		char = str.charCodeAt(i);
// 		hash = ((hash << 5) - hash) + char;
// 		hash = hash & hash; // Convert to 32bit integer
// 	}
// 	// ok
// 	return hash;
// };

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

// pad number
uu.pad = function(number, digits) {
	return number.toString().length < (digits||2) ? "0" + str.toString() : str;
}

// trim whitespace before/after
uu.trim = function(str, charlist) {
	var whitespace, l = 0,
		i = 0;
	str += '';

	if (!charlist) {
		// default list
		whitespace =
			' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
	} else {
		// preg_quote custom list
		charlist += '';
		whitespace = charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
	}

	l = str.length;
	for (i = 0; i < l; i++) {
		if (whitespace.indexOf(str.charAt(i)) === -1) {
			str = str.substring(i);
			break;
		}
	}

	l = str.length;
	for (i = l - 1; i >= 0; i--) {
		if (whitespace.indexOf(str.charAt(i)) === -1) {
			str = str.substring(0, i + 1);
			break;
		}
	}

	return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
}

// Return text
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

// Show array values as strings, to remove cyclic or memory-hogging values
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


