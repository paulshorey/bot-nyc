//console.log('# crawl.js');
window.DEBUG = false;

if (!window.casbot) {
	window.casbot = {};
}

window.casbot.crawl = function(each) {
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
			if (each.site.selectors.item_dates) {
				if (typeof each.site.selectors.item_dates == 'string') {
					each.site.selectors.item_dates = {"1":each.site.selectors.item_dates};
				}
				stack.index = 0;
				var elem;
				for (var c in each.site.selectors.item_dates) {
					stack.inverse = Object.keys(each.site.selectors.item_dates).length - stack.index;
					elem = eval('$(this)'+each.site.selectors.item_dates[c]);
					if (elem.length) {
						var timestamp = casbot.stackTime(stack, elem.get(0).innerText);
						if (!timestamp) {
							console.log('### Manual date selector did not work');
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
						// if fits into end of another, remove self
						} else if (texts_c.slice(-this_length)==stack.texts[card].toLowerCase()) {
							delete stack.texts[card];
							return;
						// if fits into beginning of another, remove self, delimeter other
						} else if (stack.texts[c].substr(0,this_length)==stack.texts[card]) {
							stack.texts[c] = stack.texts[c].slice(0,this_length) +' |'+ stack.texts[c].slice(this_length);
							delete stack.texts[card];
							return;
						// if current fits into another, remove the longer string, it's probably the parent
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
					play.texts.push(stack.texts[card]);
				}
			}
			// dates
			var keys = Object.keys(stack.dates).sort(function(a, b){return parseInt(a)-parseInt(b)}); // asc
			for (var k in keys) {
				var card = keys[k];
				if (stack.dates[card]) {
					// string
					stack.dates[card] = stack.dates[card].replace(/-|—|\ to \ /g, ' — ');
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
						play.time += (card - stack.timeToday); // ? DO NOT ? add time to date, because not all events have this and it would skew sorting
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
			if (!play.time) {
				play.score -= 1;
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