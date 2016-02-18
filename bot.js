var DT = new Date();
var FS = require('fs');
var FUN = require('./node_custom/fun.js');

var APP = {
	"sites_server": 'http://localhost:8000/sites',
	"path": '/www/bot.nyc',
	"path_in": '',
	"path_out": ''
};

var SITES = [];

var CASPER = require('casper').create({
	waitTimeout: 10000,
	stepTimeout: 10000,
	verbose: true,
	logLevel: 'debug',
	log_statuses: ['warning', 'error', 'info'],
	viewportSize: {
		width: 2000,
		height: 2000
	},
	pageSettings: {
		"userAgent": 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.10 (KHTML, like Gecko) Chrome/23.0.1262.0 Safari/537.10',
		"loadImages": true,
		"loadPlugins": false,
		"webSecurityEnabled": false,
		"ignoreSslErrors": true
	},
	onWaitTimeout: function(timeout, step) {
		this.log('onWaitTimeout\': "' + (this.site ? this.site.link : '(site not defined)') + '" : ' + timeout + 'ms', "error");
		this.clear();
		this.page.stop();
	},
	onStepTimeout: function(timeout, step) {
		this.log('onStepTimeout\': "' + (this.site ? this.site.link : '(site not defined)') + '" : ' + timeout + 'ms', "error");
		this.clear();
		this.page.stop();
	},
	onResourceReceived: function(timeout, step) {
		//this.log( 'onResourceReceived\': "' + ( this.site ? this.site.link : '(site not defined)' ) + '" : ' + timeout + 'ms', "info" );
	},
	clientScripts: [
		APP.path + "/remote_assets/vendor/all.js",
		APP.path + "/remote_assets/custom/uu.js"
	]
});

// events
CASPER.on('run.complete', function() {
	this.echo('Test completed');
	this.exit();
});
CASPER.on('remote.message', function(msg) {
	this.echo(msg);
	// msg = JSON.parse(msg);
	// if (msg && msg.status && msg.data) {
	// 	this.log(JSON.stringify(msg.data, null, " "));
	// }
});
CASPER.on("page.error", function(error, notes) {
	this.log('Remote error: ' + JSON.stringify(error, null, " ") + '\n' + JSON.stringify(notes[0], null, " "), 'error');
});
CASPER.on('http.status.404', function(resource) {
	this.log('404 error: ' + resource.url, 'error');
});
CASPER.on('http.status.500', function(resource) {
	this.log('500 error: ' + resource.url, 'error');
});
CASPER.on('complete.error', function(err) {
	this.die("Complete callback has failed: " + err);
});

// helpers
CASPER.log = function(message, status) {
	// default
	if (!status) {
		status = 'debug';
	}
	// always
	if (!this.options.log_statuses) {
		this.options.log_statuses = ['error'];
	} else if (this.options.log_statuses.indexOf('error') < 0) {
		this.options.log_statuses.push('error');
	}
	// skip
	if (this.options.log_statuses.indexOf(status) < 0) {
		return false;
	}
	// format
	if (typeof message === 'object') {
		message = JSON.stringify(Object.keys(message), null, ' ');
	} else if (typeof message === 'function') {
		message = JSON.stringify(message, null, ' ');
	} else {
		message = message;
	}
	// log
	if (!this.log.messages[message.replace(/\"*\'*\\*/g, '')]) {
		if (status == 'error') {
			message = '[ERROR]       ' + message;
			// write
			FS.write(
				'errors/' + DT.getFullYear() + '.' + this.str.pad(DT.getMonth()) + '.' + this.str.pad(DT.getDate()) + ' ' + this.str.pad(DT.getHours()) + ':' + this.str.pad(DT.getMinutes()) + ':' + this.str.pad(DT.getSeconds()) + ':' + DT.getMilliseconds() + ' .txt',
				JSON.stringify(Object.keys(this.log.messages), null, ' ') + " \n" + message,
				'w'
			);
		} else if (status === 'warning') {
			message = '[WARNING]     ' + message;
		} else if (status === 'info') {
			message = '[INFO]        ' + message;
		}
		if (status === 'debug') {
			message = '[DEBUG]       ' + message;
		}
		this.log.messages[message.replace(/\"*\'*\\*/g, '')] = true;
		this.echo(message, status.toUpperCase());

	}
};
CASPER.log.warnings = [];
CASPER.log.messages = [];
CASPER.str = Object({
	pad: function(str) {
		str = str.toString();
		var strlen = str.length || 1;
		return (strlen < 2 ? "0" + str : str);
	}
});
CASPER.hash = function(data, length) {
	if (typeof(data) == "string" && typeof(length) == "number") {
		var hash = 0;
		var i = 0;

		if (length > data.length || length === 0) {
			length = data.length;
		}

		for (i; i < length; i++) {
			hash = hash + data.charCodeAt(i);
			hash = hash + (hash << 10);
			hash = hash ^ (hash >> 6);
		}

		hash = hash + (hash << 3);
		hash = hash ^ (hash >> 11);
		hash = hash + (hash << 15);

		if (hash < 0) {
			hash = hash * -1;
		}

		return hash.toString(16);
	} else {
		throw "Inputted data must be string and inputted length must be number. Given: data: " + data + ", length: " + length;
	}
};


///////////////////////////////////////////////////////////////////
// GET /sites
///////////////////////////////////////////////////////////////////
CASPER.start();
CASPER.thenOpen('http://localhost:8000/sites', {
	method: 'post',
	data: JSON.stringify({}, null, '\t'),
	headers: {
		'Content-type': 'application/json'
	}
}, function(headers) {
	var sites = JSON.parse(this.getPageContent());
	this.echo('sites:');
	this.echo(FUN.stringify_once(sites));

	// sites
	var SITES = [];
	for (var s in sites) {
		SITES.push(sites[s]);
	}
	CASPER.eachThen(SITES, function(response) {
		this.site = JSON.parse(FUN.stringify_once(response.data));

		// site
		this.thenOpen(this.site.link, function(headers) {
			this.echo('site:' + this.site.link);

			// element
			CASPER.waitForSelector(this.site.element.selector, function(what) {
				this.site.items = this.evaluate(function(site) {
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

				}, this.site);


				///////////////////////////////////////////////////////////////
				// POST /site
				if (this.site.items) {
					var post = {};
					post.site = this.site;
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

			});

		});

	});


});
CASPER.run();