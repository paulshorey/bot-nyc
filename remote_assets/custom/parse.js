//console.log('# parse.js');

if (!window.casbot) {
	window.casbot = {};
}

casbot.stack = function(site, stack, element) {
	var tag = element.tagName;
	if ( (tag.length==1 && tag!='A') || tag=='SPAN' || tag=='ADDRESS' || tag=='NOSCRIPT' || tag=='IFRAME' || tag=='EMBED' || tag=='VIDEO' || tag=='BR' || tag=='HR' || tag=='WBR' || tag=='FORM' || tag=='TEXTAREA' || tag=='INPUT' || tag=='SELECT' || tag=='CHECKBOX' || tag=='RADIO' || tag=='BUTTON' || tag=='AUDIO') {
		return stack;
	}
	var text = uu.trim(element.innerText.replace(/[\s]+/g, ' '));
	var length = text.length;

	/*
		images
	*/
	if (stack.images && tag=='IMG' && element.src && element.src.toLowerCase().indexOf('.jpg')!=-1) {
		var score = stack.iteration*66;
		score += $(element).width()||0;
		if (!stack.x.images[element.src]) { // img must be unique per item
			stack.x.images[element.src] = true;
			stack.images[score] = element.src;
		}
		var text = $(element).attr('title') || $(element).attr('alt');
		if (!text) { // see if it can be interpreted as date or title
			return stack;
		}
	}
	if (stack.images && $(element).css('background-image') && $(element).css('background-image').toLowerCase().indexOf('.jpg')!=-1) {
		var src = ($(element).css('background-image').match(/(?:url\()([^\)]+)[\)]/)||[])[1];
		if (src) {
			var score = stack.iteration*10;
			score += $(element).width()||0;
			if (!stack.x.images[src]) { // img must be unique per item
				stack.x.images[src] = true;
				stack.images[score] = src;
			}
		}
	}

	/*
		links
	*/
	if (stack.links && tag == 'A' && element.href && element.href.length >= 10) {
		var score = stack.iteration*66;
		if (element.href.indexOf(site.links)!=-1) {
			score += 100;
		} else if (element.href.indexOf('/')===0) {
			score += 50;
		}
		if (element.href.indexOf('javascript:')==-1) {
			stack.links[score] = element.href;
		}
		if (text.indexOf(site.links)!=-1) { // if text contains link url, it is not a title
			return stack;
		}
	}

	/*
		ignore empty
	*/
	if (length < 3) {
		return stack;
	}

	/*
		dates
	*/
	if (stack.dates && length >= 3 && length < 100 && ( /[0-9]/.test(text) || /^(Now|Today|Next|Tomorrow)/i.test(text) ) ) {
		if (
			/^(Now|Today|Next|Tomorrow)/i.test(text) || 
			/[0-9][:]{1}[0-9]{2,}/.test(text) ||
			/[0-9]{2}[,\ \/]{1,2}[0-9]{2,}/.test(text) ||
			/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(text) ||
			/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(text) ||
			/(Today|January|February|March|April|May|June|July|August|September|October|November|December)/i.test(text)
		) {
			var score = stack.iteration;
			stack.dates[score] = text;
			$(element).remove();
			return stack;
		}
	}

	/*
		texts
	*/
	if (stack.texts) {
		// ignore short words, if no spaces
		if (length<15 && !/\ /.test(text)) {
			return stack;
		}
		// smoothe
		text = text+' ';
		// prefer first
		var score = stack.iteration*66;
		// ignore social
		if (length < 80 && text.match(/(share|url|bookmark)/i)) {
			return stack;
		}
		// prefer titles
		switch (tag) {
			case 'H1':
				score += 1000;
				break;
			case 'H2':
				score += 900;
				break;
			case 'H3':
				score += 800;
				break;
			case 'H4':
				score += 700;
				break;
			case 'H5':
				score += 600;
				break;
			case 'H6':
				score += 500;
				break;
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
			score += 115 - length;
		}
		// but not too short
		if (length < 15) {
			var lower = text.toLowerCase();
			if (lower != 'free') {
				score = score * length/15;
			}
		}
		// 50 chars is perfect
		// if (length < 50) {
		// 	score += length * 10;
		// } else if (length >= 50 && length < 550) {
		// 	score += 550 - length;
		// }
		
		// assign
		if (score>0) {
			score = Math.ceil(score);
			stack.texts[score] = uu.trim(text);
		}

		//console.log('### '+score+'	'+tag+': '+text.substr(0,30));
		$(element).remove();
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