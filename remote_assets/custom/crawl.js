console.log('# crawl.js');

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
				item.times = [];
				if (typeof each.site.selectors.date == 'string') {
					each.site.selectors.date = {"0":each.site.selectors.date};
				}
				for (var c in each.site.selectors.date) {
					var elem = eval('$(this)'+each.site.selectors.date[c]);
					if (elem) {
						var date = elem.text().replace(/[\s]+/g, ' ').trim();
						item.times.push(date);
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
				stack.texts = [];
				stack.x.texts = {};
			}
			if (!item.times) {
				stack.times = [];
				stack.x.times = {};
			}
			if (!item.links) {
				stack.links = [];
				stack.x.links = {};
			}
			if (!item.images) {
				stack.images = [];
				stack.x.images = {};
				// images
				var img = ($(this).html().match(/["']([^"]*.jpg)["']/i)||[])[1];
				if (img) {
					stack.images.push(img);
					stack.x.images[img] = true;
				}
			}
			$(this).find('*').reverse().each(function() {

				/*
					>> stack - parse children
				*/
				stack = casbot.stack(each.site, stack, this);

			});

			///////////////////////////////////////////////////////////////////
			// shuffle-cards (sort)
			// title
			if (!item.texts) {
				for (var card in stack.texts) {
					// start from the lowest points (back of element)
					// compare current value, to all others with higher points (front of element)
					//console.log(card,stack.texts[card]);
					var matches = [];
					for (var c in stack.texts) {
						// compare to everything higher than itself
						if (parseInt(c) > parseInt(card)) {
							// if current fits into anything higher, remove current
							//console.log(parseInt(card) +' inside'+ parseInt(c) +' ? ' + stack.texts[c].indexOf(stack.texts[card]));
							if (stack.texts[c].indexOf(stack.texts[card]) != -1) {
								delete stack.texts[card];
							}
						}
					}
				}
				stack.texts.reverse();
			}
			// date
			if (!item.times) {
				for (var card in stack.times) {
					// start from the lowest points (back of element)
					// compare current value, to all others with higher points (front of element)
					//console.log(card,stack.texts[card]);
					var matches = [];
					for (var c in stack.times) {
						// compare to everything higher than itself
						if (parseInt(c) > parseInt(card)) {
							// if current fits into anything higher, remove current
							//console.log(parseInt(card) +' inside'+ parseInt(c) +' ? ' + stack.texts[c].indexOf(stack.texts[card]));
							if (stack.times[c].indexOf(stack.times[card]) != -1) {
								delete stack.times[card];
							}
						}
					}
				}
				stack.texts.reverse();
			}
			// link
			if (!item.links) {
				stack.links.reverse();
			}
			// img
			if (!item.images) {
				stack.images.reverse();
			}

			///////////////////////////////////////////////////////////////////
			// play-card (add to item)
			// title
			if (!item.texts) {
				item.texts = [];
				for (var card in stack.texts) {
					if (stack.texts[card]) {
						item.texts.push(stack.texts[card]);
					}
				}
			}
			// date
			if (!item.times) {
				item.times = [];
				for (var card in stack.times) {
					if (stack.times[card]) {
						item.times.push(stack.times[card]);
					}
				}
			}
			// link
			if (!item.links) {
				item.links = [];
				for (var card in stack.links) {
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
			// img
			if (!item.images) {
				item.images = [];
				for (var card in stack.images) {
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
				return true;
			}
			if (!item.links[0] || item.links.length>3) {
				item.score -= 1;
			}
			if (!item.images[0]) {
				item.score -= 1;
			}
			if (item.times[0]) {
				item.score += 1;
			}
			if (item.score < 100) { // discard if missing both image and link
				return true;
			}

			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// DONE
			each.items.push(item);
			
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