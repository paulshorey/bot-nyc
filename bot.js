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
	stepTimeout: 33000,
	retryTimeout: 1000,
	verbose: true,
	logLevel: 'debug',
	log_statuses: ['warning', 'error', 'info'],
	viewportSize: {
		width: 1440,
		height: 900
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


///////////////////////////////////////////////////////////////////
// GET /sites
///////////////////////////////////////////////////////////////////
CASPER.start();
CASPER.thenOpen('http://localhost:8000/sites', {
	method: 'get'
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

		///////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////
		// HAUNT
		this.thenOpen(this.site.link, function(headers) {
			this.waitFor(function() {
				return this.site.items = this.evaluate(function(site) {
						
						// inside
						var items = [];
						if (site.element.selector && !window.haunting) {
							// play safe
							console.log('ready '+site.element.selector);
							window.haunting = true;
							window.setTimeout(function(){
								window.haunting = false;
								window.waitFive = true;
							},5000);
							// try again in 5 seconds after everything loaded
							if (!window.waitFive) {
								return false;
							}
							// ok go
							$(site.element.selector).each(function() {
								console.log('each! '+$(this).text());
								var item = {score:100};
								
								///////////////////////////////////////////////////////////////////
								///////////////////////////////////////////////////////////////////
								// MANUAL
								///////////////////////////////////////////////////////////////////
								// img // better to get automatically
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
								var stack = {x:{}};
								if (!item.title) {
									stack.title = [];
									stack.x.title = {};
								}
								if (!item.date) {
									stack.date = [];
									stack.x.date = {};
								}
								if (!item.link) {
									stack.link = [];
									stack.x.link = {};
								}
								if (!item.img) {
									stack.img = [];
									stack.x.img = {};
									var img = ($(this).html().match(/["']([^"]*.jpg)["']/i)||[])[1];
									if (img) {
										stack.img.push(img);
										stack.x.img[img] = true;
									}
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
									for (var card in stack.date) {
										// start from the lowest points (back of element)
										// compare current value, to all others with higher points (front of element)
										//console.log(card,stack.title[card]);
										var matches = [];
										for (var c in stack.date) {
											// compare to everything higher than itself
											if (parseInt(c) > parseInt(card)) {
												// if current fits into anything higher, remove current
												//console.log(parseInt(card) +' inside'+ parseInt(c) +' ? ' + stack.title[c].indexOf(stack.title[card]));
												if (stack.date[c].indexOf(stack.date[card]) != -1) {
													delete stack.date[card];
												}
											}
										}
									}
									stack.title.reverse();
								}
								// link
								if (!item.link) {
									stack.link.reverse();
								}
								// img
								if (!item.img) {
									stack.img.reverse();
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
								// img
								if (!item.img) {
									item.img = [];
									for (var card in stack.img) {
										var img = stack.img[card];
										if (img.substr(0,1)=='/' || img.substr(0,1)=='?') {
											img = site.host + img;
											item.img.push(img);
										}
									}
								}

								///////////////////////////////////////////////////////////////////
								///////////////////////////////////////////////////////////////////
								// SCORE
								if (!item.title[0]) {
									return true;
								}
								if (!item.link[0] || item.link.length>3) {
									item.score -= 1;
								}
								if (!item.img[0]) {
									item.score -= 1;
								}
								if (item.date[0]) {
									item.score += 1;
								}
								if (item.score < 100) { // discard if missing both image and link
									return true;
								}

								///////////////////////////////////////////////////////////////////
								///////////////////////////////////////////////////////////////////
								// DONE
								items.push(item);
								
							});
						}
						//console.log('ok! '+JSON.stringify(items));
						return items.length ? items : false;
						
				},this.site);
			}, function(data) {
				///////////////////////////////////////////////////////////////////
				///////////////////////////////////////////////////////////////////
				// SUCCESS
				this.echo('Found '+(this.site.items.length||0)+' items');
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
						this.echo('POSTED to /site');
					});
				}
				
			}, function(data) {
				///////////////////////////////////////////////////////////////////
				///////////////////////////////////////////////////////////////////
				// FAIL
				// send error report
				this.echo('Site failed');
			   this.echo(JSON.stringify(data));
			   this.echo(JSON.stringify(this.site.items));
			}, 
			30000 );
		
		});

	});


});
CASPER.run();