//console.log('# crawl.js');
window.DEBUG = true;

if (!window.casbot) {
	window.casbot = {};
}

window.casbot.crawl = function(each) {
	each.selectors = {};

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
	if (elements) {
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
			
			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// STACK - MANUAL
			///////////////////////////////////////////////////////////////////
			// date
			if (each.site.selectors.dates) {
				if (typeof each.site.selectors.dates == 'string') {
					each.site.selectors.dates = {"0":each.site.selectors.dates};
				}
				stack.index = 0;
				for (var c in each.site.selectors.dates) {
					stack.inverse = Object.keys(each.site.selectors.dates).length - stack.index;
					var elem = eval('$(this)'+each.site.selectors.dates[c]);
					if (elem.length) {
						var date = uu.trim(elem.text().replace(/[\s]+/g, ' '));
						stack.dates[ stack.inverse*1000 ] = date;
					}
					stack.index++;
				}
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
				// self
				$(current).get(0)._float = float;
				$(current).get(0)._depth = depth;
				// children
				if ($(current).children().length) {
					$(current).children().each(function(index){
						var child_depth = depth+1;
						var child_float = ( ($(this).siblings().length+1) - index );
						assign_layers(this, child_float, child_depth);
					});
				}

			};
			assign_layers(this);
			// parse innerHTML
			stack.iteration = 0;
			$($(this).find('*').get().reverse()).each(function() {
				stack.iteration++;
				$(this).get(0)._i = stack.iteration;
				var _score = stack.iteration.toString() + uu.pad($(this).get(0)._depth,2) + uu.pad($(this).get(0)._float,2);
				$(this).get(0)._score = _score;
				/*
					>> stack - parse children
				*/
				stack = casbot.stack(each.site, stack, this);

			});

			///////////////////////////////////////////////////////////////////
			// shuffle-cards (sort)
			// texts
			var keys = Object.keys(stack.texts).sort(function(a, b){return parseInt(a)-parseInt(b)}); // ascending
			keys.reverse().forEach(function(card){
				if (!stack.texts[card]) {
					return;
				};
				// start from the lowest points (back of element)
				// compare current value, to all others with higher points (front of element)
				var matches = [];
				keys.forEach(function(c){
					if (!stack.texts[c]) {
						return;
					};
					var texts_c = stack.texts[c].toLowerCase();
					// compare
					if (card > c) {
						if (stack.texts[c] == stack.texts[card].toLowerCase()) {
							// if same, keep higher score
							delete stack.texts[c];
						} else if (texts_c.indexOf(stack.texts[card].toLowerCase()) != -1) {
							// if current fits into another, remove the longer string, it's probably the parent
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
			var play = {score:100};
			play.images = [];
			play.links = [];
			play.dates = [];
			play.times = [];
			play.texts = [];

			// texts
			var keys = Object.keys(stack.texts).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
			for (var k in keys) {
				var card = keys[k];
				if (stack.texts[card]) {
					play.texts.push(unescape(encodeURIComponent(stack.texts[card])));
				}
			}
			// dates
			var keys = Object.keys(stack.dates).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
			for (var k in keys) {
				var card = keys[k];
				if (stack.dates[card]) {
					stack.dates[card] = stack.dates[card].replace(/-|—|\ to \ /g, ' — ');
					play.dates.push(unescape(encodeURIComponent(uu.trim(stack.dates[card]))));
				}
			}
			// times
			var keys = Object.keys(stack.times).sort(function(a, b){return parseInt(a)-parseInt(b)}); // ascending: prefer lower date, because they are all high enough
			for (var k in keys) {
				var card = keys[k];
				if (stack.times[card]) {
					play.times.push(stack.times[card]);
				}
			}
			// links
			var keys = Object.keys(stack.links).sort(function(a, b){return parseInt(b)-parseInt(a)}); // descending
			for (var k in keys) {
				var card = keys[k];
				var link = stack.links[card];
				// absolute
				if (link.indexOf(each.site.host)===0) {
					play.links.push(link);
				// other site (not allow ??)
				} else if (link.substring(0,4)=='http') {
					//play.links.push(link);
				} else if (link.substring(0,3)=='www') {
					//play.links.push('http://'+link);
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
				if (img.substr(0,1)=='/' || img.substr(0,1)=='?') {
					img = each.site.host+img;
				}
				play.images.push(img);
			}

			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// SCORE
			///////////////////////////////////////////////////////////////////
			if (!play.texts[0]) {
				play.score = 0;
			}
			if (!play.links[0] || play.links.length>5) {
				play.score -= 1;
			}
			if (!play.images[0]) {
				play.score -= 1;
			}
			if (play.dates[0]) {
				play.score += 1;
			}

			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// VIEW
			///////////////////////////////////////////////////////////////////
			if (DEBUG) {
				console.log('# '+(JSON.stringify(stack,null,'\t')));
				console.log('## '+(JSON.stringify(play,null,'\t')));
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
	}

	// more elements
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

	// next site
	return each;

}