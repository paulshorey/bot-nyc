if (!window.casbot) {
	window.casbot = {};
}

window.casbot.crawl = function(each) {
	window.DEBUG = each.DEBUG;
	window.CONFIG = each.CONFIG;

	// clear more selector which got us here from previous page, to reset at the bottom for next thenClick
	$('#thenClickSelector').remove();
	each.selectors = {};

	// get site
	if (!each.site.title) {
		each.site.title = window.document.title;
	}

	// get elements
	var elements = {};
	if (each.site.selectors.item) {
		try {
			// as jquery command: $('.item')
			elements = eval(each.site.selectors.item);
		} catch(e) {
			// as jquery selector: .item
			elements = $(each.site.selectors.item);
		}
	} else {
		// later automate
	}

	// each element
	if (!elements) {
		return false;
	}

	each.items = [];
	var i = 0;
	elements.each(function() {
	try {
		i++;

		///////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////
		// STACK CARDS
		///////////////////////////////////////////////////////////////////
		var stack = {};
		stack.texts = {};
		stack.times = {};
		stack.dates = {};
		stack.links = {};
		stack.images = {};
		stack.timeToday = Date.parse(Date.create('today'));
		stack.timeTomorrow = Date.parse(Date.create('tomorrow'));
		stack.featured_images = {};
		stack.prices = {};
		
		///////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////
		// STACK - MANUAL
		///////////////////////////////////////////////////////////////////
		// date
		if (each.site.selectors.item_dates) {
			if (typeof each.site.selectors.item_dates == 'string') {
				each.site.selectors.item_dates = {"1":each.site.selectors.item_dates};
			}
			stack.index = 0;
			for (var c in each.site.selectors.item_dates) {
				stack.inverse = Object.keys(each.site.selectors.item_dates).length - stack.index;
				try {
					var elem = eval('$(this)'+each.site.selectors.item_dates[c]);
				} catch(e) {
					var elem = $(this).find(each.site.selectors.item_dates[c]);
				}
				console.log('### '+elem[0].innerText);
				if (elem[0] && elem[0].innerText) {
					// use
					var timestamp = casbot.stackTime(stack, elem[0].innerText);
					if (!timestamp) {
						console.log('### Manual date selector did not work');
					}
				}
				stack.index++;
			}
		}
		// price
		if (each.site.selectors.item_prices) {
			if (typeof each.site.selectors.item_prices == 'string') {
				each.site.selectors.item_prices = {"1":each.site.selectors.item_prices};
			}
			stack.index = 0;
			for (var c in each.site.selectors.item_prices) {
				stack.inverse = Object.keys(each.site.selectors.item_prices).length - stack.index;
				try {
					var elem = eval('$(this)'+each.site.selectors.item_prices[c]);
				} catch(e) {
					var elem = $(this).find(each.site.selectors.item_prices[c]);
				}
				if (elem.length) {
					var prices = elem[0].innerText.match(/(\$[0-9\,\.]+)/); // match
					if (prices && prices[1]) {
						prices = prices[1].split(/-|\ /); // match first only
						for (var p in prices) { // in case first is accidentally multiple, separate them
							var score = parseInt(prices[p].replace(/[^0-9]/g, ""))||0;
							// use
							stack.prices[score] = prices[p];
						}
					}
					
				}
				stack.index++;
			}
		}
		// ignore
		if (each.site.selectors.item_ignore) {
			$(this).find(each.site.selectors.item_ignore).remove();
		}
		
		///////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////
		// STACK - AUTO
		///////////////////////////////////////////////////////////////////
		// parse outerHTML
		var img = ($(this).html().match(/["']([^"]*.jpg)["']/i)||[])[1];
		if (img) {
			stack.images[100] = img;
		}
		// sort html
		var assign_layers = function(current, float, depth) {
			if (!float) {
				float = 1;
				depth = 1;
			}
			// wrap text nodes
			var textNodes = $(current).contents().filter(function(){
				return (this.nodeType===3 && $(this).siblings().length);
			});
			textNodes.each(function(){
				var replacementNode = document.createElement('span');
				replacementNode.innerHTML = this.textContent;
				$(this).before(replacementNode);
				this.parentNode.removeChild(this);
			});
			// self
			var divs_length = ($(current).get(0).innerHTML.match(/(<[P|H1|H2|H3|H4|H5|H6|DIV|SPAN|SUB|SUP|SUMMARY|PRE|NAV|DL|DT|FORM|UL|LI|A|OL|TH|TABLE|TBODY|TH|TD|BLOCKQUOTE|ARTICLE|SECTION|MAIN|FIGURE|CAPTION|LABEL|FONT|FOOTER|HEADER|FIGCAPTION]+)/gi) || [] ).length;
			$(current).get(0)._children = divs_length;
			// children
			if (divs_length) {
				$(current).children().each(function(index){
					// console.log('## '+('<'+current.tagName+'>' || '*'+current.nodeType+'*'));
					// console.log('# '+uu.trim(current.innerHTML||current.nodeContent).substr(0,40)+'...');
					$(this).get(0)._parent = $(current).get(0).tagName;
					$(this).get(0).innerHTML = $(this).get(0).innerHTML+' ';
					assign_layers(this);
				});
			}

		};
		assign_layers(this);
		// parse innerHTML
		stack.iteration = 100;
		$($(this).find('*').get().reverse()).each(function() {
			stack = casbot.stack(each.site, stack, this);

		});

		///////////////////////////////////////////////////////////////////
		// shuffle-cards (sort)
		// texts
		var keys = Object.keys(stack.texts).sort(function(a, b){return parseInt(a)-parseInt(b)}); // ascending
		keys.reverse().forEach(function(card){ // descending
			if (!stack.texts[card]) {
				return;
			};
			var this_length = stack.texts[card].length;
			// start from the lowest points (back of element)
			// compare current value, to all others with higher points (front of element)
			var matches = [];
			keys.forEach(function(c){ // ascending
				if (!stack.texts[card] || !stack.texts[c]) {
					return;
				};
				var texts_c = stack.texts[c].toLowerCase();
				// compare
				if (card != c) {
					// if same, keep higher score
					if (texts_c == stack.texts[card].toLowerCase()) {
						delete stack.texts[c];
					// if self starts/ends with other, remove self (self is probably parent)
					} else if (stack.texts[card].startsWith(stack.texts[c]+' ') || stack.texts[card].endsWith(stack.texts[c]+' ')) {
						delete stack.texts[c];
						return;
					// // if other starts with self, remove self, delimeter other
					// } else if (stack.texts[c].startsWith(stack.texts[card])) {
					// 	var other = uu.trim(stack.texts[c].replace(stack.texts[card]));
					// 	var self = stack.texts[card];
					// 	stack.texts[c] = self +' |'+ other;
					// 	delete stack.texts[card];
					// 	return;
					// // if other ends with self, remove self, delimeter other
					// } else if (stack.texts[c].endsWith(stack.texts[card])) {
					// 	var other = uu.trim(stack.texts[c].replace(stack.texts[card]));
					// 	var self = stack.texts[card];
					// 	stack.texts[c] = other +' |'+ self;
					// 	delete stack.texts[card];
					// 	return;
					// if self fits into another, remove other longer string (other is probably the parent)
					} else if (texts_c.indexOf(stack.texts[card].toLowerCase()) != -1) {
						delete stack.texts[c];
					}
				}
			});
		});
		// dates
		var keys = Object.keys(stack.dates).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
		for (var k in keys) {
			var card = keys[k];
			if (!stack.dates[card]) {
				break;
			}
			stack.dates[card] = stack.dates[card].toUpperCase();
			// start from the lowest points (back of element)
			// compare current value, to all others with higher points (front of element)
			var matches = [];
			for (var c in stack.dates) {
				// compare to all others
				if (parseInt(c) != parseInt(card)) {
					// if current fits into another, remove the longer string, it's probably the parent
					if (stack.dates[c].toUpperCase().indexOf(stack.dates[card]) != -1) {
						delete stack.dates[c];
					}
				}
			}
		}
		// links
		for (var card in stack.links) {
			// start from the lowest points (back of element)
			// compare current value, to all others with higher points (front of element)
			var matches = [];
			for (var c in stack.links) {
				// compare to all others
				if (parseInt(c) != parseInt(card)) {
					// if current fits into anything higher, remove the shorter one, it's probably incomplete
					if (stack.links[c].indexOf(stack.links[card]) != -1) {
						delete stack.links[card];
					}
				}
			}
		}
		// images
		var keys = Object.keys(stack.images).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
		for (var k in keys) {
			var card = keys[k];
			if (!stack.images[card]) {
				break;
			}
			// start from the lowest points (back of element)
			// compare current value, to all others with higher points (front of element)
			var matches = [];
			for (var c in stack.images) {
				// compare to all others
				if (parseInt(c) != parseInt(card)) {
					// if current fits into anything higher, remove the shorter one, it's probably incomplete
					if (stack.images[c].indexOf(stack.images[card]) != -1) {
						delete stack.images[card];
					}
				}
			}
		}


		///////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////
		// PLAY CARDS
		///////////////////////////////////////////////////////////////////
		var play = {};
		play.images = [];
		play.links = [];
		play.dates = [];
		play.times = [];
		play.texts = [];
		play.featured_images = stack.featured_images;
		play.featured = '';
		play.price = null;

		// featured image 
		if (Object.keys(stack.featured_images).length) {
			var highest = Object.keys(stack.featured_images).reduce(function(A, B){
				var iA = parseInt(A)||0;
				var iB = parseInt(B)||0;
				return iA>iB ? stack.featured_images[A] : stack.featured_images[B];
			});
			play.featured = stack.featured_images[ highest ];
		}

		// price 
		if (Object.keys(stack.prices).length) {
			var lowest = 0;
			if (!stack.prices[ lowest ]) {
				lowest = Object.keys(stack.prices).reduce(function(A, B){
					var iA = parseInt(A)||0;
					var iB = parseInt(B)||0;
					return iA<iB ? stack.prices[A] : stack.prices[B];
				});
			}
			play.price = stack.prices[ lowest ];
		}

		// texts
		var keys = Object.keys(stack.texts).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
		for (var k in keys) {
			var card = keys[k];
			var text = stack.texts[card];
			if (text) {
				play.texts.push(text);
			}
		}
		// dates
		var keys = Object.keys(stack.dates).sort(function(a, b){return parseInt(a)-parseInt(b)}); // asc
		for (var k in keys) {
			var card = keys[k];
			if (stack.dates[card]) {
				// string
				stack.dates[card] = stack.dates[card].replace(/-|—|–|\ to \ /g, ' — ');
				play.dates.push(uu.trim(stack.dates[card]));
				// timestamp
				card = parseInt(card);
				play.time = card;
				break;
			}
		}
		// time
		var keys = Object.keys(stack.times).sort(function(a, b){return parseInt(a)-parseInt(b)}); // asc
		for (var k in keys) {
			var card = keys[k];
			if (stack.times[card]) {
				// string
				play.times.push(stack.times[card]);
				// timestamp
				card = parseInt(card);
				if (play.time) {
					play.time += (card - stack.timeToday); // maybe ? DO NOT ? add time to date, because not all events have this and it would skew sorting
					break;
				} else {
					throw 'No date: '+JSON.stringify(stack); // no date... maybe assume today?
				}
			}
		}
		// links
		var keys = Object.keys(stack.links).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
		for (var k in keys) {
			var card = keys[k];
			var link = stack.links[card];
			if (!link) {
				delete stack.links[card];
				continue;
			}
			// absolute
			if (link.indexOf(each.site.host)===0) {
				play.links.push(link);
			// other site (not allow ??)
			} else if (link.substring(0,4)=='http') {
				play.links.push(link);
			} else if (link.substring(0,3)=='www') {
				play.links.push('http://'+link);
			// relative
			} else if (link.substring(0,1)=='/') {
				play.links.push(each.site.host+link);
			} else {
				play.links.push(each.site.host+'/'+link);
			}
		}
		// images
		var keys = Object.keys(stack.images).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
		for (var k in keys) {
			var card = keys[k];
			var img = stack.images[card];
			if (!img) {
				delete stack.images[card];
				continue;
			}
			if (img.substr(0,1)=='/' || img.substr(0,1)=='?') {
				img = each.site.host+img;
			}
			play.images.push(img);
		}

		// score
		play.score = 100;

		if (stack.ignore) {
			play.score = 0;
		}
		if (!play.dates[0]) {
			play.score == 0;
		}
		if (!play.texts[0]) {
			play.score = 0;
		}
		if (play.texts.join().length<20) {
			play.score -= 1;
		}
		if (!play.links[0]) {
			play.score -= 1;
		}

		///////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////
		// VIEW
		///////////////////////////////////////////////////////////////////
		if (DEBUG) {
			console.log('# stack = '+(JSON.stringify(stack,null,'\t')));
		}

		///////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////
		// DONE
		///////////////////////////////////////////////////////////////////
		// assign
		if (play.score >= 100) {
			each.items.push(play);
		}
		// cleanup
		$(this).remove();

	} catch(e) {
		console.log('### '+e);
	}
	});


	// // look through deck for jokers
	// // text
	// var total = each.items.length;
	// var texts = {};
	// for ( var event in each.items ) {
	// 	for ( var t in each.items[event].texts ) {
	// 		var text = each.items[event].texts[t];
	// 		texts[text] = (texts[text]||0) + 1;
	// 	}
	// }
	// for ( var text in texts ) {
	// 	var text_count = texts[text];
	// 	if (text_count>(total/2)) {
	// 		for ( var event in each.items ) {
	// 			for ( var t in each.items[event].texts ) {
	// 				if (each.items[event].texts[t]==text) {
	// 					each.items[event].texts.splice(t,t+1);
	// 				}
	// 			}
	// 		}
	// 	}
	// }
	// // images
	// var total = each.items.length;
	// var images = {};
	// for ( var event in each.items ) {
	// 	for ( var i in each.items[event].images ) {
	// 		var image = each.items[event].images[i];
	// 		images[image] = (images[image]||0) + 1;
	// 	}
	// }
	// for ( var image in images ) {
	// 	var image_count = images[image];
	// 	if (image_count>(total/2)) {
	// 		for ( var event in each.items ) {
	// 			for ( var i in each.items[event].images ) {
	// 				if (each.items[event].images[i]==image) {
	// 					each.items[event].images.splice(i,i+1);
	// 				}
	// 			}
	// 		}
	// 	}
	// }


	// // more elements
	// if (each.items.length) {
	// 	if (each.site.selectors.more) {
	// 		// more selector

	// 		var more = {};
	// 		if (each.site.selectors.item) {
	// 			try {
	// 				// as jquery command: $('.item')
	// 				more = eval(each.site.selectors.more);
	// 			} catch(e) {
	// 				// as jquery selector: .item
	// 				more = $(each.site.selectors.more);
	// 			}
	// 		} else {
	// 			// later automate
	// 		}
	// 		if (more.length && !/disabled|active|selected/.test(more.get(0).outerHTML)) {
	// 			// still has link
	// 			more.attr('id','thenClickSelector');
	// 			each.selectors.more = '#thenClickSelector';
	// 		} else {
	// 			// no more
	// 			each.site.selectors.more = null;
	// 		}
	// 	} else {
	// 		// automatic selector
	// 		// coming soon
	// 	}
	// }
	if (DEBUG) {
		console.log('## items = '+(JSON.stringify(each.items,null,'\t')));
	}
	




	// save
	if (each.items.length) {
		var post = {items:[]};
		for (var it in each.items) {
			// MODEL
			// item temporary stack
			var its = each.items[it];
			if (!its.texts) {
				continue;
			}
			//CASPER.console.warn(JSON.stringify(its,null,'\t'));
			// item
			var item = {};
				item.texts = its.texts.splice(0,3);
				item.image = its.images[0] || '';
				item.link = its.links[0] || each.site.link;
				item.timestamp = its.time;
				item.featured_images = its.featured_images;
				item.featured = its.featured;
				item.time = its.times[0];
				item.date = its.dates[0];
				item.price = its.price;
				item.scene = '';
				for (var sc in each.site.scenes) {
					var scene = each.site.scenes[sc];
					if (!scene.title) {
						continue;
					}
					item.scene += uu.capitalize(scene.title)+' ';
				}
				item.category = '';
				for (var sc in each.site.categories) {
					var category = each.site.categories[sc];
					if (!category.title) {
						continue;
					}
					item.category += uu.capitalize(category.title)+' ';
				}
				item.source = each.site.title;
				item.source = item.source.split(' | ').reverse().join(' | ');
				var matched = each.site.host.match(/[\/|\.]+([a-zA-Z0-9]+)[\.]{1}([a-z]+)$/);
				item.source_host = matched[1]+'.'+matched[2];
				item.source_link = each.site.link;
				item.source_title = item.source;
				item.random = Math.ceil(Math.random()*10000000); //FUN.hash_int(its.texts[0]+its.texts[1]+its.texts[2]);
				// item = uu.deep_map(item, function(val, key){
				// 	if (typeof val == 'string') {
				// 		return unescape(encodeURIComponent(val));
				// 	}
				// 	return val;
				// });
			// conform to api
			if (item.text && item.date) {
				item.text = item.text.replace(item.date,'');
			}
			// save
			post.items.push(item);
		}
		each.crawled = post.items.length;
		
		// post
		// message
		var pre = '###';
		if (post.items.length) {
			pre = '##';
		}
		console.log(pre+' Post '+post.items.length+' items to '+(CONFIG.api_host+'/items')+' items');
		if (DEBUG) {
			console.log(pre+' '+JSON.stringify(post));
		}
		// send
		$.ajax({
			type: 'POST',
			url: CONFIG.api_host+'/items',
			crossDomain: true,
			data: post,
			dataType: 'json'
		});
		// temp
		// also save on server
		if (CONFIG.api_host.indexOf('localhost')!=-1) {
			$.ajax({
				type: 'POST',
				url: 'http://api.allevents.nyc/items',
				crossDomain: true,
				data: post,
				dataType: 'json'
			});
		}
		

		return each;
	} else {
		return false;
	}

}