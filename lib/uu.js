var uu = new Object({
	
	// Test require
	test : function() { return 'CONGRATULATIONS!!! uu variable successfully required!'; },
	
	// Strings
	str : Object({
		
		// Leading zero
		pad : function(str) {
			return str.length < 2 ? "0"+str.toString(): str;
		}
		
	}),
		
	// Remove whitespace before/after
	trim : function(str, charlist) {
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
	},
	
	// Return text
	strip_tags : function(input, allowed) {
		allowed = (((allowed || '') + '')
		  .toLowerCase()
		  .match(/<[a-z][a-z0-9]*>/g) || [])
		  .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
		  
		var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
		  commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
		  
		return input.replace(commentsAndPhpTags, '')
		  .replace(tags, function ($0, $1) {
		    return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
		  });
	},
	
	// Return "http://..."
	parseUrl : function(_in) {
		var match = _in.match(/(href="|href=')((http:|https:)?\/\/)?([\da-zA-Z\.-]+)\.([a-zA-Z\.]{2,6})([\/\w, \.-]*)*\/?("|')/);
		if (match && match[0]) {
			match = match[0].match(/[^href=](.*)/);
			match = match[0].match(/[^"|'](.*)[^"|']/);
			return match[0];
		} else {
			match = _in.match(/(href=")([a-zA-Z\/\d\ \.-])*(")/);
			if (match && match[0]) {
				match = match[0].match(/[^href=](.*)/);
				match = match[0].match(/[^"|'](.*)[^"|']/);
				return match[0];
			} else {
				match = _in.match(/("|')((http:|https:)?\/\/)?([\da-zA-Z\.-]+)\.([a-zA-Z\.]{2,6})([\/\w, \.-]*)*\/?("|')/);
				if (match && match[0]) {
					match = match[0].match(/[^"|'](.*)[^"|']/);
					return match[0];
				}
			}
		}
	},
	
	// Prepare for command line output
	val : function(_in) {
		// undefined
		if ( _in === undefined ) {
			return 0;
		// null
		} else if ( _in === null ) {
			return 0;
		// value
		} else {
			return _in;
		}
	},
	
	// Prepare for command line output
	consoleLog : function(_in) {
		console.log( 
			JSON.stringify( 
				{"status":"log","data": uu.consoleSimpleArray(_in) } 
			) 
		);
	},

	// Show array values as strings, to remove cyclic or memory-hogging values
	consoleArray : function(_in) {
		return _in;
	},

	// Show array values as strings, to remove cyclic or memory-hogging values
	// 1 level deep
	consoleSimpleArray : function(_in) {
		// ...
		var _out = [];
		var _i = 0;
		// array
		if ( typeof _in === 'object' ) {
			for (_i in _in) {
				if(_in.hasOwnProperty(_i)){
					_out.push([_i,_in[_i]+'']);
				}
			}
		// undefined
		} else if ( _in === undefined ) {
			_out = 'undefined';
		// null
		} else if ( _in === null ) {
			_out = 'null';
		// string
		} else {
			_out = _in+'';
		}
		// ...
		return _out;
	},

	// Show array values as strings, to remove cyclic or memory-hogging values
	// 1 level deep
	consoleDoubleArray : function(_in) {
		// ...
		var _out = [];
		var _i = 0;
		// array
		if ( typeof _in === 'object' ) {
			for (_i in _in) {
				if(_in.hasOwnProperty(_i)){
					_out.push([_i, uu.consoleSimpleArray(_in[_i]) ]);
				}
			}
		// undefined
		} else if ( _in === undefined ) {
			_out = 'undefined';
		// null
		} else if ( _in === null ) {
			_out = 'null';
		// string
		} else {
			_out = _in+'';
		}
		// ...
		return _out;
	}

});