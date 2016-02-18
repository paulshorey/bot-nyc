// world's smallest jQuery plugin:
if (jQuery) {
	jQuery.fn.reverse = [].reverse;
} else {
	console.warn('recommendation: use jQuery');
}

// ok, now...
var uu = new Object({
	
	hashId: function(str) {
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
		return hash;
	},
	
	parseRecursive: function(site,item,element) {
		// var html = element.innerHTML;
		// if (html.indexOf('<br'!=-1)) {
		// }
		
		var text = element.innerText;
		
		// item . date
		if (text.length < 50 && text.replace(/[^0-9]/g,"").length >= 2) { // not too long // at least 2 numbers
			if (/[0-9]{2}[,\ \/]{1,2}[0-9]{2,}/.test(text) || /(2016)/i.test(text) || /\n(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(text) || /\n(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(text) || /(January|February|March|April|May|June|July|August|September|October|November|December)/i.test(text)) {
				item.date = text;
				return true;
			}
		}
		
		// item . title
		if (text.length > 10 && text.length > item.title.length && ( text.indexOf(item.title)==-1 || text.indexOf(item.date)==-1 ) ) { // not too short // better than old title // not parent
			item.title = text;
			return true;
		}
		
		// unnecessarily complicated
		//this.setAttribute("id", uu.hashId(this.innerHTML));
	},
	
	parseSimple: function(site,item,element) {
		var html = element.innerHTML;
		var links = [];
		html.replace(/(?:<a)+[^>]*(?:href=)['"](.*)[\/?]['"]/g,function(match,one,two,three) {
			return links.push(one);
		});
		links = links.reverse(); // guessing best links are towards the top
		// item . link
		for (var li in links) {
			var link = links[li];
			// perfect "http://domain.com/..."
			if (link.indexOf(site.host)==0) {
				item.link = link;
				return true;
			}
			// relative
			if (/^\//.test(link)) {
				// maybe
				item.link = link;
			} else if (!item.link) {
				// last resort
				item.link = link;
			}
		}
		
		// var lines = html;
		// lines = lines.replace(/<[^>]*>/g,'');
		// lines = lines.replace(/[\s]{2,}/g,'\n');
		// lines = lines.replace(/[\ ]{2,}/g,' ');
		// lines = lines.split('\n').reverse();
	
		// item.date = '';
		// item.title = '';
		// for (var li in lines) {
		// 	var line = lines[li];
			
		// 	// item . date
		// 	if (line.length < 50 && line.length > item.date.length) {
				
		// 		item.date = line;
				
		// 	}
			
		// 	// item . title
		// 	if (line.length > 15 && line.length > item.title.length) {
				
		// 		item.title = line;
			
		// 	}
										
		// }
		
	},
	
	parseImg: function(site,item,element) {
		item.img = {
			src: '',
			width: 0
		};
		var img = item.img;
		// this
		if ($(this).is('img')) {
			item.img = {
				"src": uu.val($(this).attr('src')),
				"width": uu.val($(this).width())
			};
			item.link = item.img.src;
			items.push(item);
			return true;
		} else {
			// child
			$(this).find('img').each(function() {
				img = {
					"src": uu.val($(this).attr('src')),
					"width": uu.val($(this).width())
				};
				if (img.src && img.width > item.img.width) {
					item.img = img;
				}
			});
			// background
			if (!item.img.src || item.img.width < 100) {
				if ($(this).css('background-image')) {
					img = {
						"src": uu.val($(this).css('background-image')),
						"width": uu.val($(this).width())
					};
					if (img.src && img.width > item.img.width) {
						item.img = img;
					}
				}
			}
			// child background
			if (!item.img.src || item.img.width < 100) {
				$(this).find('*').each(function() {
					if ($(this).css('background-image')) {
						img = {
							"src": uu.val($(this).css('background-image')),
							"width": uu.val($(this).width())
						};
						if (img.src && img.width > item.img.width) {
							item.img = img;
						}
					}
				});
			}
		}
		if (!item.img.src) {
			item.img = {};
		}
	},
	
	// html2dom: function(html) {
	// 	var parser = new DOMParser();
	// 	return parser.parseFromString(html, "text/html");
	// },
	// dom2html: function(dom) {
	// 	var target = document.getElementById(dom);
	// 	var wrap = document.createElement('div');
	// 	wrap.appendChild(target.cloneNode(true));
	// 	return wrap.innerHTML;
	// },
	
	// Test require
	// { return 'CONGRATULATIONS!!! uu variable successfully required!'; },
	
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