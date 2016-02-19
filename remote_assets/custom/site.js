var siteeval = function(site) {
	var items = [];
	if (site.element.selector) {
		$(site.element.selector).each(function() {
			var item = {};
			item.img = {};
			pp.parseImg(site, item, this);
			
			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// MANUAL
			///////////////////////////////////////////////////////////////////
			// title
			if (site.element.title) {
				item.title = [];
			}
			// date
			if (site.element.date) {
				item.date = [];
				if (typeof site.element.date == 'string') {
					site.element.date = {"0":site.element.date};
				}
				for (var c in site.element.date) {
					var elem = eval('$(this)'+site.element.date[c]);
					if (elem) {
						var date = uu.trim(elem.text().replace(/[\s]+/g, ' '));
						item.date.push(date);
					}
				}
			}
			// link
			if (site.element.link) {
				item.link = [];
			}
			
			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// AUTO
			///////////////////////////////////////////////////////////////////
			// stack-cards (parse)
			var stack = {};
			if (!item.title) {
				stack.title = [];
			}
			if (!item.date) {
				stack.date = [];
			}
			if (!item.link) {
				stack.link = [];
			}
			stack.i = 0;
			$(this).find('*').reverse().each(function() {
				pp.parseStack(site, stack, this);
				stack.i++;
			});

			///////////////////////////////////////////////////////////////////
			// shuffle-cards (sort)
			// title
			if (!item.title) {
				for (var card in stack.title) {
					// start from the lowest points (back of element)
					// compare current value, to all others with higher points (front of element)
					//console.log(card,stack.title[card]);
					var matches = [];
					for (var c in stack.title) {
						// compare to everything higher than itself
						if (parseInt(c) > parseInt(card)) {
							// if current fits into anything higher, remove current
							//console.log(parseInt(card) +' inside'+ parseInt(c) +' ? ' + stack.title[c].indexOf(stack.title[card]));
							if (stack.title[c].indexOf(stack.title[card]) != -1) {
								delete stack.title[card];
							}
						}
					}
				}
				stack.title.reverse();
			}
			// date
			if (!item.date) {
				stack.date.reverse();
			}
			// link
			if (!item.link) {
				stack.link.reverse();
			}

			///////////////////////////////////////////////////////////////////
			// play-card (add to item)
			// title
			if (!item.title) {
				item.title = [];
				for (var card in stack.title) {
					if (stack.title[card]) {
						item.title.push(stack.title[card]);
					}
				}
			}
			// date
			if (!item.date) {
				item.date = [];
				for (var card in stack.date) {
					if (stack.date[card]) {
						item.date.push(stack.date[card]);
					}
				}
			}
			// link
			if (!item.link) {
				item.link = [];
				for (var card in stack.link) {
					var link = stack.link[card];
					// perfect "http://domain.com/..."
					if (link.indexOf(site.host)==0) {
						item.link.push(link);
					}
					// relative
					if (/^\//.test(link)) {
						// maybe
						item.link.push(site.host+link);
					} else if (link.length > 10 && !item.link) {
						// last resort
						item.link.push(site.host+'/'+link);
					}
				}
			}

			///////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////
			// DONE
			///////////////////////////////////////////////////////////////////
			items.push(item);

		});
	}
	return items;

};
var sitepost = function(site){
	///////////////////////////////////////////////////////////////
	// POST /site
	if (site.items) {
		var post = {};
		post.site = site;
		// post
		CASPER.thenOpen('http://localhost:8000/site', {
			method: 'post',
			data: JSON.stringify(post, null, '\t'),
			headers: {
				'Content-type': 'application/json'
			}
		}, function(headers) {
			this.echo('posted site');
		});
	}
};