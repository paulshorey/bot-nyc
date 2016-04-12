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
						var date = uu.trim(elem.text().replace(/[\s]+/g, ' '));
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
			if (DEBUG) {
				console.log('# '+(JSON.stringify(stack,null,'\t')));
			}

			///////////////////////////////////////////////////////////////////
			// shuffle-cards (sort)
			// texts
			if (!item.texts) {
				var keys = Object.keys(stack.texts).sort(function(a, b){return parseInt(a)-parseInt(b)}); // ascending
				keys.reverse().forEach(function(card){
					if (!stack.texts[card]) {
						return;
					};
					console.log('### '+card);
					// start from the lowest points (back of element)
					// compare current value, to all others with higher points (front of element)
					var matches = [];
					keys.forEach(function(c){
						if (!stack.texts[c]) {
							return;
						};
						// compare
						if (card > c) {
							if (stack.texts[c] == stack.texts[card]) {
								// if same, keep higher score
								delete stack.texts[c];
							} else if (stack.texts[c].indexOf(stack.texts[card]) != -1) {
								// if current fits into another, remove the longer string, it's probably the parent
								delete stack.texts[c];
							}
						}
					});
				});
			}
			// dates
			if (!item.dates) {
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
			}
			// times
			var timeIteration = 0;
			if (!item.dates) {
				timeIteration++;
				var keys = Object.keys(stack.dates).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
				for (var k in keys) {
					var card = keys[k];
					if (!stack.dates[card]) {
						break;
					}
					var timestamp = Date.parse(Date.create(stack.dates[card]));
					if (!timestamp) {
						var delimiters = /—|-|\ to\ |\(|\)|\@/;
						var strings = stack.dates[card].split(delimiters);
						for (var ea in strings) {
							timestamp = Date.parse(Date.create(strings[ea]));
							if (timestamp>timeToday) {
								timestamp;
								break;
							}
						}
					}
					if (timestamp >= timeToday) {
						stack.times[timestamp+timeIteration] = timestamp;
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
								stack.times[timestamp+timeIteration] = timestamp;
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
							// if current fits into anything higher, remove the shorter one, it's probably incomplete
							if (stack.links[c].indexOf(stack.links[card]) != -1) {
								delete stack.links[card];
							}
						}
					}
				}
			}
			// images
			if (!item.images) {
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
			}

			///////////////////////////////////////////////////////////////////
			// play-card (add to item)
			// texts
			if (!item.texts) {
				item.texts = [];
				var keys = Object.keys(stack.texts).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
				for (var k in keys) {
					var card = keys[k];
					if (stack.texts[card]) {
						item.texts.push(unescape(encodeURIComponent(stack.texts[card])));
					}
				}
			}
			// dates
			if (!item.dates) {
				item.dates = [];
				var keys = Object.keys(stack.dates).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
				for (var k in keys) {
					var card = keys[k];
					if (stack.dates[card]) {
						stack.dates[card] = stack.dates[card].replace(/-|—|\ to \ /g, ' — ');
						item.dates.push(unescape(encodeURIComponent(uu.trim(stack.dates[card]))));
					}
				}
			}
			// times
			if (!item.times) {
				item.times = [];
				var keys = Object.keys(stack.times).sort(function(a, b){return parseInt(a)-parseInt(b)}); // ascending: prefer lower date, because they are all high enough
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
				var keys = Object.keys(stack.links).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
				for (var k in keys) {
					var card = keys[k];
					var link = stack.links[card];
					// absolute
					if (link.indexOf(each.site.host)===0) {
						item.links.push(link);
					// other site (not allow ??)
					} else if (link.substring(0,4)=='http') {
						//item.links.push(link);
					} else if (link.substring(0,3)=='www') {
						//item.links.push('http://'+link);
					// relative
					} else if (link.substring(0,1)=='/') {
						item.links.push(each.site.host+link);
					} else {
						item.links.push(each.site.host+'/'+link);
					}
				}
			}
			// images
			if (!item.images) {
				item.images = [];
				var keys = Object.keys(stack.images).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
				for (var k in keys) {
					var card = keys[k];
					var img = stack.images[card];
					if (img.substr(0,1)=='/' || img.substr(0,1)=='?') {
						img = each.site.host+img;
					}
					item.images.push(img);
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
			// CONSOLE
			if (DEBUG) {
				console.log('## '+(JSON.stringify(item,null,'\t')));
			}

			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// DONE
			if (item.score >= 100) {
				each.items.push(item);
			}
			
			// CLEANUP
			$(this).remove();

		});
	}

	// more items
	if (each.items.length) {
		if (each.site.selectors.more) {
			// more selector
			if ($(each.site.selectors.more).length && !/disabled|active|selected/.test($(each.site.selectors.more).get(0).outerHTML)) {
				// still has link
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