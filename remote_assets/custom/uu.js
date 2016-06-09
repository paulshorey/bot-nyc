/*
	uniquely unique
*/
var uu = new Object();

uu.is_object = function(obj) {
	if (Object.prototype.toString.call(obj) == '[object Object]') {
		return true;
	}
};
uu.is_array = function(obj) {
	if (Object.prototype.toString.call(obj) == '[object Array]') {
		return true;
	}
};
uu.to_array = function(obj) {
	if (typeof obj == 'object') {
		return Object.keys(obj).map(function(k) { return obj[k] });
	} else {
		return [obj];
	}
}

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
uu.pad = function(num, front) {
	num = (num||0);
	front = (front||2);
	num = num.toString().substring(0,front);
	return num.length < front ? ('0'.repeat(front-num.length))+num : num;
}
uu.pad_ends = function(num, front, back) {
	num = (num||0);
	front = (front||2);
	back = (back||2);
	num = uu.pad(num,front);
	num = num.substring(0,back);
	return num.length < back ? num+('0'.repeat(back-num.length)) : num;
}

// trim whitespace before/after
uu.trim = function(str){
	str = str.replace(/(^[^\$\#a-zA-Z0-9\(\)\?\!\.]*)|([^a-zA-Z0-9\(\)\?\!\.]*$)/g, '');
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
uu.stringify_once = function(_in) {
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
				_out.push([_i, uu.stringify_once(_in[_i])]);
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

uu.deep_map = function(obj, f, ctx) {
	if (Array.isArray(obj)) {
	    return obj.map(function(val, key) {
	        return (typeof val === 'object') ? uu.deep_map(val, f, ctx) : f.call(ctx, val, key);
	    });
	} else if (typeof obj === 'object') {
	    var res = {};
	    for (var key in obj) {
	        var val = obj[key];
	        if (typeof val === 'object') {
	            res[key] = uu.deep_map(val, f, ctx);
	        } else {
	            res[key] = f.call(ctx, val, key);
	        }
	    }
	    return res;
	} else {
	    return obj;
	}
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


if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    'use strict';
    if (this == null) {
      throw new TypeError('can\'t convert ' + this + ' to object');
    }
    var str = '' + this;
    count = +count;
    if (count != count) {
      count = 0;
    }
    if (count < 0) {
      throw new RangeError('repeat count must be non-negative');
    }
    if (count == Infinity) {
      throw new RangeError('repeat count must be less than infinity');
    }
    count = Math.floor(count);
    if (str.length == 0 || count == 0) {
      return '';
    }
    // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (August 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so:
    if (str.length * count >= 1 << 28) {
      throw new RangeError('repeat count must not overflow maximum string size');
    }
    var rpt = '';
    for (;;) {
      if ((count & 1) == 1) {
        rpt += str;
      }
      count >>>= 1;
      if (count == 0) {
        break;
      }
      str += str;
    }
    // Could we try:
    // return Array(count + 1).join(this);
    return rpt;
  }
}