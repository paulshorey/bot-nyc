//console.log('# parse.js');

if (!window.casbot) {
	window.casbot = {};
}

casbot.stackTime = function(stack, text) {
	var delimiters = /—|-|\ to\ |\(|\)|\@/;
	var strings = text.split(delimiters);
	for (var ea in strings) {
		var string = uu.trim(strings[ea]);

		// is date?
		var timestamp = Date.parse(Date.create(string));
		if (string.toLowerCase().substr(0,3) == 'now') {
			timestamp = stack.timeToday;
		}
		if (!timestamp) {
			var strs = string.split(/\ |,|\'|\"/);
			for (var ea in strs) {
				strs.pop();
				var str = strs.join(' ');
				timestamp = Date.parse(Date.create(str));
				if (timestamp) {
					break;
				}
			}
		}
		
		// yes!
		if (timestamp) {
			// date & time, today
			if (/[a-zA-Z]{3,}/.test(string) && timestamp > stack.timeToday) {
				stack.dates[timestamp] = string;
			// time, not sure if today or later, possibly date and time
			} else if (timestamp > stack.timeToday && timestamp < stack.timeTomorrow) {
				stack.times[timestamp] = string;
			// date, today or in the future
			} else if (timestamp == stack.timeToday || timestamp > stack.timeTomorrow) {
				stack.dates[timestamp] = string;
			// past
			} else {
				throw 'Date is in the past ['+timestamp+'] = '+string+'';
			}
		}

	}
	return timestamp;
};

casbot.stack = function(site, stack, element) {
	
	// filter
	var tag = element.tagName;
	var tags_read = 'P|H1|H2|H3|H4|H5|H6|IMG|VIDEO|DIV|SPAN|SUB|SUP|SUMMARY|PRE|NAV|DL|DT|FORM|UL|LI|A|OL|TH|TABLE|TBODY|TH|TD|BLOCKQUOTE|ARTICLE|SECTION|MAIN|FIGURE|CAPTION|LABEL|FONT|FOOTER|HEADER|FIGCAPTION';
	var tags_delete = 'NOSCRIPT';
	var html_regex = new RegExp('/(<['+tags_read+']+)/gi');
	var tag_regex_read = new RegExp('/^'+tags_read+'$/gi');
	var tag_regex_delete = new RegExp('/^'+tags_delete+'$/gi');
	if (!tag_regex_read.test(tag)) {
		if (tag_regex_delete.test(tag)){
			$(element).remove();
		}
		return stack;
	}
	var text = uu.trim(element.innerText.replace(/[\s]+/g, ' '));
	var length = text.length;

	// score
	stack.iteration++;
	var divs = (element.innerHTML.match(html_regex) || [] ).length;
	var score = parseInt( ( stack.iteration - element._children ).toString() + ( stack.iteration.toString().slice(-2) ) );

	/*
		images
	*/
	if (stack.images && tag=='IMG' && element.src && element.src.toLowerCase().indexOf('.jpg')!=-1) {
		var images_score = score;
		images_score *= ($(element).width()||10)/10;
		stack.images[Math.ceil(images_score)] = element.src;
		var text = $(element).attr('title') || $(element).attr('alt');
		if (!text) { // see if it can be interpreted as date or title
			return stack;
		}
	}
	if (stack.images && $(element).css('background-image') && $(element).css('background-image').toLowerCase().indexOf('.jpg')!=-1) {
		var images_score = score;
		var src = ($(element).css('background-image').match(/(?:url\()([^\)]+)[\)]/)||[])[1];
		if (src) {
			images_score *= ($(element).width()||10)/10;
			stack.images[Math.ceil(images_score)] = src;
		}
	}

	/*
		links
	*/
	if (stack.links && tag == 'A' && element.href && element.href.length > 3) {
		var links_score = score;
		// ignore text
		if (/Google Map|=http|twitter|facebook|linkedin|pinterest/i.test(text)) {
			$(element).remove();
			return stack;
		}
		// ignore
		if (/\/ical|javascript:/.test(element.href)) {
			$(element).remove();
			return stack;
		}
		// real
		var http_this = element.href.replace('https','http');
		var http_site = site.host.replace('https','http');
		if (http_this.indexOf(http_site)!=-1) {
			links_score *= 10;
		} else if (element.href.indexOf('/')===0) {
			links_score *= 2;
		}
		// ok
		stack.links[Math.ceil(links_score)] = element.href;
	}

	/*
		not relevant
	*/
	if (length < 20 && /^more|share|show|view|get/i.test(text)) {
		$(element).remove();
		return stack;
	}
	if (length < 20 && ['url', 'twitter', 'facebook'].indexOf(text.toLowerCase())!=-1) {
		$(element).remove();
		return stack;
	}

	/*
		dates
	*/
	if (text.length >= 3 && text.length < 100 && ( /[0-9]/.test(text) || /^(Now|Today|Next|Tomorrow)/i.test(text) ) ) {
		if (
			/^(Now|Today|Next|Tomorrow)/i.test(text) || 
			/[0-9][:]{1}[0-9]{2,}/.test(text) ||
			/[0-9]{2}[,\ \/]{1,2}[0-9]{2,}/.test(text) ||
			/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(text) ||
			/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(text) ||
			/(Today|January|February|March|April|May|June|July|August|September|October|November|December)/i.test(text)
		) {
			var timestamp = casbot.stackTime(stack, text);
			if (timestamp) {
				$(element).remove();
				return stack;
			}
		}
	}

	// needed for dates, but not for texts
	if (tag=='SPAN') {
		return stack;
	}

	/*
		texts
	*/
	if (stack.texts) {
		var texts_score = score;
		// ignore single characters
		if (length<2) {
			return stack;
		}
		// smoothe
		text = text+' ';
		// prefer titles
		switch (tag) {
			case 'H1':
				texts_score *= 10;
				break;
			case 'H2':
				texts_score *= 9;
				break;
			case 'H3':
				texts_score *= 8;
				break;
			case 'H4':
				texts_score *= 7;
				break;
			case 'A':
				if (length > 20) {
					texts_score *= 6;
				}
				break;
			case 'H5':
				texts_score *= 5;
				break;
		}
		if ($(element).is(':hidden')) {
			texts_score /= 2;
		}
		if (text.toLowerCase().substr(0,1)=='$' || text.toLowerCase().substr(0,4)=='free' || text.toLowerCase().substr(0,20).indexOf('more')!=-1) {
			texts_score /= 3;
		}
		if (text.toLowerCase().substr(0,20).indexOf('location')!=-1 || text.toLowerCase().substr(0,60).indexOf('new york, ny')!=-1) {
			texts_score /= 4;
		}
		// UPPER case prefered
		// var upp = (text.substr(0,100).match(/[A-Z]/g)||'').length||0;
		// var low = (text.substr(0,100).match(/[^A-Z]/g)||'').length||0;
		// if (upp > low) {
		// 	var x = 1; // dont care too much about capitalization
		// 	if (length > 5 && length < 50) {
		// 		x = 50 - length;
		// 	}
		// 	score += (upp - low) * x;
		// }		
		// shorter is better
		if (length >= 15 && length <= 115) {
			texts_score *= 100 / (115 - length);
		}
		// but not too short
		if (length < 15) {
			texts_score *= length/15;
		}
		// 0-20, 20-220
		if (length < 20) {
			texts_score *= ( (length / 20) + 1) / 2;
		} else if (length >= 20 && length < 220) {
			texts_score *= 220 / (length-20);
		}
		
		// assign
		stack.texts[Math.ceil(texts_score)] = uu.trim(text);
		//console.log('### '+score+'	'+tag+': '+text.substr(0,30));
		if (element._parent && element._parent.substr(0,1)!='H') {
			if (DEBUG) {
				console.log('### '+tag+' [ '+     stack.iteration +' - '+ parseInt(element._children) +' ] '+uu.trim(text).substr(0,40)+'...   <'+$(element).parent().get(0).tagName+'>');
			}
			$(element).remove();
			return stack;
		}
		if (DEBUG) {
			console.log('# '+tag+' [ '+     stack.iteration +' - '+ parseInt(element._children) +' ] '+uu.trim(text).substr(0,40)+'...   <'+$(element).parent().get(0).tagName+'>');
		}
		return stack;
	}

	return stack;
};

































casbot.parse = function(site, stack){
	var parsed = {};
	return parsed;
};

casbot.scrollBottom = function(){
	window.cancelInterval(casbot.scrollInterval);
	casbot.scrollInterval = window.setInterval(function(){
		window.document.body.scrollTop = $(document).height();
	},500);
};
casbot.scroll = function(){

	// window.document.body.scrollTop = Math.min( window.document.body.scrollTop+100,  $(document).height()-$(window).height() ) ;
	// console.log('## "'+window.location.href+'" scroll='+window.document.body.scrollTop);
	// $(window).ajaxSend(function() {
	// 	console.log('## ajaxSend');
	// });
	// $(window).ajaxComplete(function() {
	// 	console.log('## ajaxComplete');
	// });
	
	// target
	var hash = window.location.hash.substr(1);
	if (hash) {
		if ($('a[name="'+hash+'"]').length) {
			var y = $('a[name="'+hash+'"]').offset().top;
			if (window.document.body.scrollTop < y) {
				window.document.body.scrollTop = y + 200;
				casbot.scrolledToTarget = y;
			}
		} else if ($('#'+hash).length) {
			var y = $('#'+hash).first().offset().top;
			window.document.body.scrollTop = y + 200;
			casbot.scrolledToTarget = y;
		}
	}
	
	// bottom
	if (casbot.scrolledToTarget) {
		window.cancelTimeout(casbot.scrollTimeout);
		casbot.scrollTimeout = window.setTimeout(function(){
			casbot.scrollBottom();
		},500);
	} else {
		casbot.scrollBottom();
	}

};
//casbot.scroll();