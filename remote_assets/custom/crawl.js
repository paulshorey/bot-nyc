//console.log('# crawl.js');
window.DEBUG = true;

if (!window.casbot) {
	window.casbot = {};
}

window.casbot.crawl = function(each) {
	each.selectors = {};

	// items
	var elements = {};
	if (each.site.selectors.item) {
		elements = $(each.site.selectors.item);
	} else {
		// later automate
	}

	// item
	if (elements) {
		each.items = [];
		var timeToday = Date.parse(Date.create('today'));
		var i = 0;
		elements.each(function() {
			i++;
			var item = {score:100};
			
			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// MANUAL
			///////////////////////////////////////////////////////////////////
			// img // better to get automatically
			// title
			if (each.site.selectors.text) {
				item.texts = [];
			}
			// date
			if (each.site.selectors.date) {
				item.dates = [];
				if (typeof each.site.selectors.date == 'string') {
					each.site.selectors.date = {"0":each.site.selectors.date};
				}
				for (var c in each.site.selectors.date) {
					var elem = eval('$(this)'+each.site.selectors.date[c]);
					if (elem) {
						var date = elem.text().replace(/[\s]+/g, ' ').trim();
						item.dates.push(date);
					}
				}
			}
			// link
			if (each.site.selectors.link) {
				item.links = [];
			}
			
			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// AUTO
			///////////////////////////////////////////////////////////////////
			// stack-cards (parse)
			var stack = {x:{}};
			/*
				>> stack - parse parent
			*/
			if (!item.texts) {
				stack.texts = {};
				stack.x.texts = {};
			}
			if (!item.dates) {
				stack.times = {};
				stack.dates = {};
				stack.x.dates = {};
			}
			if (!item.links) {
				stack.links = {};
				stack.x.links = {};
			}
			if (!item.images) {
				stack.images = {};
				stack.x.images = {};
				// images
				var img = ($(this).html().match(/["']([^"]*.jpg)["']/i)||[])[1];
				if (img) {
					stack.images[100] = img;
					stack.x.images[img] = true;
				}
			}
			stack.iteration = 0;
			$($(this).find('*').get().reverse()).each(function() {
				stack.iteration++;
				/*
					>> stack - parse children
				*/
				stack = casbot.stack(each.site, stack, this);

			});

			///////////////////////////////////////////////////////////////////
			// shuffle-cards (sort)
			// texts
			if (!item.texts) {
				for (var card in stack.texts) {
					// start from the lowest points (back of element)
					// compare current value, to all others with higher points (front of element)
					var matches = [];
					for (var c in stack.texts) {
						// compare to all others
						if (parseInt(c) != parseInt(card)) {
							// if current fits into anything higher, remove the longer one, it's probably the parent
							if (stack.texts[c].indexOf(stack.texts[card]) != -1) {
								delete stack.texts[c];
							}
						}
					}
				}
			}
			// dates / times
			if (!item.dates) {
				for (var card in stack.dates) {
					stack.dates[card] = stack.dates[card].toLowerCase();
					// start from the lowest points (back of element)
					// compare current value, to all others with higher points (front of element)
					var matches = [];
					for (var c in stack.dates) {
						// compare to all others
						if (parseInt(c) != parseInt(card)) {
							// if current fits into anything higher, remove the longer one, it's probably the parent
							if (stack.dates[c].indexOf(stack.dates[card]) != -1) {
								delete stack.dates[c];
							}
						}
					}
					// parse timestamp
					var timestamp = Date.parse(Date.create(stack.dates[card]));
					if (!timestamp) {
						var strings = stack.dates[card].split(/—|-|\ to\ /);
						for (var ea in strings) {
							timestamp = Date.parse(Date.create(strings[ea]));
							if (timestamp>timeToday) {
								timestamp += 1000;
								break;
							}
						}
					}
					if (timestamp >= timeToday) {
						stack.times[timestamp] = timestamp;
						break;
					}
					// try removing last word
					if (!timestamp) {
						var strings = stack.dates[card].split(/\ |,|\'|\"/);
						for (var ea in strings) {
							// this should be a recursive function
							strings.pop();
							var string = strings.join(' ');
							//
							if (string == 'now') {
								timestamp = timeToday;
								stack.times[timestamp] = timestamp;
								break;
							}
							// 
							timestamp = Date.parse(Date.create(string));
							if (timestamp>=timeToday) {
								stack.times[timestamp] = timestamp + 1000;
								break;
							}
						}
					}
				}
			}
			// links
			if (!item.links) {
				for (var card in stack.links) {
					// start from the lowest points (back of element)
					// compare current value, to all others with higher points (front of element)
					var matches = [];
					for (var c in stack.links) {
						// compare to all others
						if (parseInt(c) != parseInt(card)) {
							// if current fits into anything higher, remove the longer one, it's probably the parent
							if (stack.links[c].indexOf(stack.links[card]) != -1) {
								delete stack.links[c];
							}
						}
					}
				}
			}
			// images
			if (!item.images) {
				for (var card in stack.images) {
					// start from the lowest points (back of element)
					// compare current value, to all others with higher points (front of element)
					var matches = [];
					for (var c in stack.images) {
						// compare to all others
						if (parseInt(c) != parseInt(card)) {
							// if current fits into anything higher, remove the longer one, it's probably the parent
							if (stack.images[c].indexOf(stack.images[card]) != -1) {
								delete stack.images[c];
							}
						}
					}
				}
			}
			if (DEBUG) {
				console.log('# '+(JSON.stringify(stack,null,'\t')));
			}

			///////////////////////////////////////////////////////////////////
			// play-card (add to item)
			// texts
			if (!item.texts) {
				item.texts = [];
				var keys = Object.keys(stack.texts).reverse();
				for (var k in keys) {
					var card = keys[k];
					if (stack.texts[card]) {
						item.texts.push(stack.texts[card]);
					}
				}
			}
			// dates
			if (!item.dates) {
				item.dates = [];
				var keys = Object.keys(stack.dates).reverse();
				for (var k in keys) {
					var card = keys[k];
					if (stack.dates[card]) {
						item.dates.push(stack.dates[card]);
					}
				}
			}
			// times
			if (!item.times) {
				item.times = [];
				var keys = Object.keys(stack.times).sort();
				for (var k in keys) {
					var card = keys[k];
					if (stack.times[card]) {
						item.times.push(stack.times[card]);
					}
				}
			}
			// links
			if (!item.links) {
				item.links = [];
				if (Object.keys(stack.links).length<=3) {
					var keys = Object.keys(stack.links).reverse();
					for (var k in keys) {
						var card = keys[k];
						var link = stack.links[card];
						// absolute
						if (link.indexOf(each.site.host)==0) {
							item.links.push(link);
						}
						// relative
						if (/^\//.test(link)) {
							// maybe
							item.links.push(each.site.host+link);
						} else if (link.length > 10 && !item.links) {
							// last resort
							item.links.push(each.site.host+'/'+link);
						}
					}
				}
			}
			// images
			if (!item.images) {
				item.images = [];
				var keys = Object.keys(stack.images).reverse();
				for (var k in keys) {
					var card = keys[k];
					var img = stack.images[card];
					if (img.substr(0,1)=='/' || img.substr(0,1)=='?') {
						img = each.site.host + img;
						item.images.push(img);
					}
				}
			}

			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// FILTER
			// iterate each for each and if a value is the same in each, remove it for each

			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// SCORE
			if (!item.texts[0]) {
				item.score = 0;
			}
			if (!item.links[0] || item.links.length>5) {
				item.score -= 1;
			}
			if (!item.images[0]) {
				item.score -= 1;
			}
			if (item.dates[0]) {
				item.score += 1;
			}

			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// DEBUG
			if (DEBUG) {
				console.log('## '+(JSON.stringify(item,null,'\t')));
			}

			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// DONE
			if (item.score >= 100) {
				each.items.push(item);
			}
			
		});
	}

	// more items
	if (each.items.length) {
		if (each.site.selectors.more) {
			// manual selector
			if ($(each.site.selectors.more).length) {
				each.selectors.more = each.site.selectors.more;
			} else {
				// no more
				each.site.selectors.more = null;
			}
		} else {
			// automatic selector
			// coming soon
		}
	}

	// next
	return each;

}