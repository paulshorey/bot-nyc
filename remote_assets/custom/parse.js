if (!window.casbot) {
	window.casbot = {};
}

casbot.stackTime = function(stack, text) {
	if (!text) {
		return false;
	}
	// remove time range to help parsing (8-11pm = 8pm)
	var match = text.match(/[0-9]+?(-[0-9]{1,2})\ ?(?:am|pm)/i);
	if (match) {
		text = text.replace(match[1],'');
	}
	// parse
	var delimiters = /—|-|–|\ to\ |\(|\)|\@/;
	var strings = text.split(delimiters);

	for (var ea in strings) {
		if (parseInt(strings[ea])) {
			continue;
		}
		var string = uu.trim(strings[ea]);
		if (!string) {
			continue;
		}
		var mmdd = /([0-9]{2}\/[0-9]{2})/;
		if (string.match(mmdd)) {
			string = string.replace(mmdd,'$1/'+(Date.create().format('{yyyy}')));
		}
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
				if (DEBUG) {
					console.log('### Date is in the past  ['+timestamp+'] <= '+string+'');
				}
			}
		}

	}
	return timestamp;
}; 

casbot.stack = function(site, stack, element) {
	
	// filter
	var tag = element.tagName;
	var tags_read = 'time | p | em | h1 | h2 | h3 | h4 | h5 | h6 | img | video | div | span | sub | sup | summary | pre | nav | dl | dt | form | ul | li | a | ol | th | table | tbody | th | td | blockquote | article | section | main | figure | caption | label | font | footer | header | figcaption'.replace(/\ /g,'').toUpperCase();
	var tags_delete = 'script | noscript | code'.replace(/\ /g,'').toUpperCase();
	//var html_regex = new RegExp('/(<['+tags_read+']+)/gi');
	var tag_regex_read = new RegExp('/'+tags_read+'$/gi');
	var tag_regex_delete = new RegExp('/'+tags_delete+'$/gi');
	if (!tag_regex_read.test(tag)) { // ignore
		if (tag_regex_delete.test(tag)){ // then delete
			$(element).remove();
		}
		return stack;
	}
	var text = uu.trim(element.innerText.replace(/[\s]+/g, ' '));
	var text25 = text.toLowerCase().substr(0,25);
	var text50 = text.toLowerCase().substr(0,50);
	var length = text.length;
	// score
	stack.iteration++;
	//var divs = (element.innerHTML.match(html_regex) || [] ).length;
	var score = parseInt( ( stack.iteration - element._children ).toString() + ( stack.iteration.toString().slice(-2) ) );
	var score_original = score;

	/*
		images
	*/
	if (stack.images && tag=='IMG' && element.src) {
		if (/\.png|\.gif/i.test(element.src)) {
			return stack;
		}
		var images_score = score;
		images_score *= ($(element).width()||10)/10;
		stack.images[Math.ceil(images_score)] = element.src;

		if ( $(element).width() > 100 && ( $(element).height() < $(element).width() ) ) {
			stack.featured_images[Math.ceil(images_score)] = element.src;
		}

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
		if (/Google Map|=http|twitter|facebook|linkedin|pinterest/i.test(text50)) {
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
		// good
		if (/more|&raquo;/gi.test(text)) {
			links_score *= 100;
		}
		if (/\?/.test(text)) {
			links_score /= 10;
		}
		if (/\&/.test(text)) { // again, if multiple uri vars ?one=one&two=two, then demoted twice!
			links_score /= 10;
		}
		// ok
		stack.links[Math.ceil(links_score)] = element.href;
	}

	/*
		not relevant
	*/
	if (/^more|share|show|view|get|date|event|ongoing/i.test(text25)) {
		$(element).remove();
		return stack;
	}
	if (length < 40 && ['url', 'twitter', 'facebook'].indexOf(text.toLowerCase())!=-1) {
		$(element).remove();
		return stack;
	}

	/*
		dates
	*/
	if (text.length >= 3 && text.length < 100 && ( /[0-9]/.test(text) || /^(Now|Today|Next|Tomorrow)/i.test(text) ) ) {
		if (
			/^(Now|Today|Next|Tomorrow)/i.test(text) || // now playing
			/[0-9]{1,2}\ ?(?:am|pm)/.test(text) || // 9pm
			/[0-9][:]{1}[0-9]{2,}/.test(text) || // 6:30
			/[0-9]{2}[,\ \/]{1,2}[0-9]{2,}/.test(text) || // 5/16
			/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(text) ||
			/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(text) ||
			/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(text) ||
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
		price
	*/
	if (text.indexOf('$')!=-1 || text.toLowerCase().indexOf('free')!=-1) {
		var matched = text.match(/\$[0-9]*|free\ /gi);
		for (var p in matched) {
			var price = matched[p].toLowerCase();
			if (price=='free ') {
				stack.prices[0] = 'free';
			} else {
				price = parseInt(price.substr(1));
				stack.prices[price] = '$'+price;
			}
		}
		if (text.length<5) {
			$(element).remove();
			return stack;
		}
	}

	/*
		texts
	*/
	if (stack.texts) {
		var texts_score = score;
		// ignore single characters
		if (length<4) {
			return stack;
		}
		// smoothe
		text = text+' ';

		// PROMOTE
		// titles
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

		// DEMOTE
		// sold out
		if (text50.indexOf('sold out')!=-1) {
			score.ignore = true;
			return stack;
		}

		// hidden, free
		if (text.toLowerCase().substr(0,20).indexOf('free')!=-1 || $(element).is(':hidden')) {
			texts_score /= 10;
		}

		// IGNORE
		// locations, counts
		if (/[0-9.\ ]{2,}[a-z]{2,}\ ?$/i.test(text) || /[0-9.\ ]{2,}(?:mile|kilo)/.test(text) || /^location|new york, ny|[a-z]+\ ?\,\ ?[0-9]{5}/i.test(text.substr(0,60))) {
			$(element).remove();
			return stack;
		}
		// prices, hashtags, bookmark
		if (text.substring(1,8)=='ookmark' || text.substr(0,1)=='#' || text.substr(0,60).indexOf('$')!=-1 || text.toLowerCase().substr(0,20).indexOf('more')!=-1) {
			$(element).remove();
			return stack;
		}

		// // length
		// // shorter is better
		// if (length >= 15 && length <= 115) {
		// 	texts_score *= 100 / (115 - length);
		// }
		// // but not too short
		// if (length < 15) {
		// 	texts_score *= length/15;
		// }
		// // 0-20, 20-220
		// if (length < 20) {
		// 	texts_score *= ( (length / 20) + 1) / 2;
		// } else if (length >= 20 && length < 220) {
		// 	texts_score *= 220 / (length-20);
		// }
		
		// assign
		stack.texts[Math.ceil(texts_score)] = uu.trim(text);
		if (element._parent && element._parent.substr(0,1)!='H') {
			if (DEBUG) {
				console.log('### '+tag+' [ '+     stack.iteration +' - '+ parseInt(element._children) +' ] '+uu.trim(text).substr(0,120)+'...   <'+$(element).parent().get(0).tagName+'>');
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
































casbot.hash_int = function(str) {
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
	return hash;
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