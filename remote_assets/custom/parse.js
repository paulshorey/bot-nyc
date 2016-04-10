//console.log('# parse.js');

if (!window.casbot) {
	window.casbot = {};
}

casbot.stack = function(site, stack, element) {
	var tag = element.tagName;
	if (tag=='SCRIPT' || tag=='NOSCRIPT' || tag=='IFRAME' || tag=='EMBED' || tag=='VIDEO' || tag=='BR' || tag=='HR' || tag=='WBR' || tag=='FORM' || tag=='TEXTAREA' || tag=='INPUT' || tag=='SELECT' || tag=='CHECKBOX' || tag=='RADIO' || tag=='BUTTON' || tag=='AUDIO') {
		return stack;
	}
	var text = element.innerText.replace(/[\s]+/g, ' ').trim()+' ';
	var length = text.length;

	/*
		images
	*/
	if (stack.images && tag=='IMG' && element.src && element.src.toLowerCase().indexOf('.jpg')!=-1) {
		var score = stack.iteration*10;
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
		var score = stack.iteration*10;
		if (element.href.indexOf(site.links)!=-1) {
			score += 100;
		} else if (element.href.indexOf('/')===0) {
			score += 50;
		}
		stack.links[score] = element.href;
		if (length < 40 || text.indexOf(site.links)!=-1) { // if text contains link url, it is not a title ... if link is short, then its probably not the title either
			return stack;
		}
	}

	/*
		ignore empty
	*/
	if (length < 10) {
		return stack;
	}

	/*
		dates
	*/
	if (stack.dates && length > 8 && length < 44 && ( (text.match(/[0-9]/g)||'').length>=2 || /^(Now|Today|Next|Tomorrow)/i.test(text) ) ) {
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
			return stack;
		}
	}

	/*
		texts
	*/
	if (stack.texts && text.length > 10) {
		var score = stack.iteration*10;
		// social?
		if (length < 80 && text.match(/(share|url|bookmark)/i)) {
			return stack;
		}
		// title?
		switch (tag) {
			case 'H1':
				score += 100;
				break;
			case 'H2':
				score += 90;
				break;
			case 'H3':
				score += 80;
				break;
			case 'H4':
				score += 70;
				break;
			case 'H5':
				score += 60;
				break;
			case 'H6':
				score += 50;
				break;
			case 'P':
				score += 40;
				break;
			case 'BLOCKQUOTE':
				score += 30;
				break;
		}
		// UPPER case prefered
		// var upp = (text.substr(0,50).match(/[A-Z]/g)||'').length||0;
		// var low = (text.substr(0,100).match(/[^A-Z]/g)||'').length||0;
		// if (upp > low) {
		// 	var x = 10;
		// 	if (length > 10 && length < 50) {
		// 		x = 50 - length;
		// 	}
		// 	score += (upp - low) * x;
		// }
		// shorter is better
		if (length > 10 && length < 100) {
			score += 100 - length;
		}
		// 40 perfect, 20-90 ok
		if (length == 50) {
			score += 100;
		} else if (length > 20 && length < 40) {
			score += (length-20)*5;
		} else if (length > 40 && length < 90) {
			score += (100 - ((length-40)*2));
		}
		
		if (score>0) {
			stack.texts[score] = text.trim();
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