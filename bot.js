//"use strict";
var DT = new Date();
var FS = require('fs');
var FUN = require('./node_custom/fun.js');

var APP = {
	"sites_server": 'http://api.allevents.nyc',
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
	//logLevel: 'debug',
	log_statuses: ['warning', 'error', 'info','log','debug'],
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
	CASPER.console.warn('Test completed');
	this.exit();
});
CASPER.on('remote.message', function(msg) {
	CASPER.console.log('		' + msg, 'error');
});
CASPER.on("page.error", function(error, notes) {
	CASPER.console.error('		Error: ' + JSON.stringify(error, null, " ") + '\n' + JSON.stringify(notes[0], null, " "), 'error');
});
CASPER.on('http.status.404', function(resource) {
	CASPER.console.error('		404 error: ' + resource.url, 'error');
});
CASPER.on('http.status.500', function(resource) {
	CASPER.console.error('		500 error: ' + resource.url, 'error');
});
CASPER.on('complete.error', function(err) {
	CASPER.die("		Complete callback has failed: " + err);
});
// helpers
CASPER.console = {};
CASPER.console.html = '';
CASPER.console.date = '';
CASPER.iteration = '?';
if (CASPER.cli.has("iteration")) {
	CASPER.iteration = CASPER.cli.get("iteration");
}
CASPER.console.write = function(message, status) {
	// start each day
	if (CASPER.console.date != DT.getFullYear() + '.' + FUN.pad(DT.getMonth()+1) + '.' + FUN.pad(DT.getDate())) {
		CASPER.console.html = '';
		CASPER.console.date = DT.getFullYear() + '.' + FUN.pad(DT.getMonth()+1) + '.' + FUN.pad(DT.getDate());
	}
	// skip banal debug logs
	if (status=='debug') {
		return false;
	}
	// format
	if (typeof message == 'object') {
		message = JSON.stringify(message, null, ' ').replace(/[\n\r\t]/g,'');
	} else if (typeof message == 'function') {
		message = JSON.stringify(message, null, ' ').replace(/[\n\r\t]/g,'');
	} else if (typeof message == 'string') {
		message = message.trim();
		message = message.replace(/[\n\r\t]/g,'');
	} else {
		message = '('+(typeof message)+')';
	}
	// log
	// to FILE
	var action = (status=='error'||status=='info') ? status : 'log';
	if (status=='warning') {
		action = 'warn';
	}
	CASPER.console.html = '<script>console.'+action+'(\''+message.replace(/\'/g, '\\\'')+'\');</script>\n' + CASPER.console.html;
	FS.write(
		'public/console/logs.html', // + ' ' + FUN.pad(DT.getHours()) + ':' + FUN.pad(DT.getMinutes()) + ':' + FUN.pad(DT.getSeconds()) + ':' + DT.getMilliseconds()
		CASPER.console.html,
		'w'
	);
	// to CONSOLE
	if (status == 'error') {
		message = message;
	} else if (status == 'warning') {
		message = message;
	} else if (status == 'info') {
		message = message;
	} else if (status == 'debug') {
		message = message;
	}
	CASPER.echo(message, status.toUpperCase());
};
CASPER.console.log = function(message) {
	CASPER.console.write(message, 'log');
}
CASPER.console.info = function(message) {
	CASPER.console.write(message, 'info');
}
CASPER.console.warn = function(message) {
	CASPER.console.write(message, 'warning');
}
CASPER.console.error = function(message) {
	CASPER.console.write(message, 'error');
}
CASPER.console.warn('CASPER.cli.options');
CASPER.console.warn(CASPER.cli.options);
CASPER.console.info( 'Crawl #'+CASPER.iteration +' '+ DT.getFullYear() + '.' + FUN.pad(DT.getMonth()+1) + '.' + FUN.pad(DT.getDate()) + ' ' + FUN.pad(DT.getHours()) + ':' + FUN.pad(DT.getMinutes()) + ':' + FUN.pad(DT.getSeconds()) + ':' + DT.getMilliseconds() );

///////////////////////////////////////////////////////////////////
// GET /sites
///////////////////////////////////////////////////////////////////
CASPER.start();
CASPER.thenOpen(APP.sites_server+'/sites', {
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
						if (site.selector.item && !window.haunting) {
							// play safe
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
							$(site.selector.item).each(function() {
								var item = {score:100};
								
								///////////////////////////////////////////////////////////////////
								///////////////////////////////////////////////////////////////////
								// MANUAL
								///////////////////////////////////////////////////////////////////
								// img // better to get automatically
								// title
								if (site.selector.title) {
									item.title = [];
								}
								// date
								if (site.selector.date) {
									item.date = [];
									if (typeof site.selector.date == 'string') {
										site.selector.date = {"0":site.selector.date};
									}
									for (var c in site.selector.date) {
										var elem = eval('$(this)'+site.selector.date[c]);
										if (elem) {
											var date = uu.trim(elem.text().replace(/[\s]+/g, ' '));
											item.date.push(date);
										}
									}
								}
								// link
								if (site.selector.link) {
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
										// absolute
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
				CASPER.console.info('Found '+(this.site.items.length||0)+' items');
				if (this.site.items) {
					var post = {};
					post.site = this.site;
					// post
					CASPER.thenOpen(APP.sites_server+'/site', {
						method: 'post',
						data: JSON.stringify(post, null, '\t'),
						headers: {
							'Content-type': 'application/json'
						}
					}, function(headers) {
						CASPER.console.info('POSTED to /site');
					});
				}
				
			}, function(data) {
				///////////////////////////////////////////////////////////////////
				///////////////////////////////////////////////////////////////////
				// FAIL
				// send error report
				CASPER.console.error('Site failed:');
			   CASPER.console.warn(JSON.stringify(data));
			}, 
			30000 );
		
		});

	});


});
CASPER.run();