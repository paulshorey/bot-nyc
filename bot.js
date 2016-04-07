// SETUP
// same bot.js as go.js

		//"use strict";
		//https://github.com/benfoxall/phantomjs-webserver-example/blob/master/server.js
		var DT = new Date();
		var FS = require('fs');
		var FUN = require('./node_custom/fun.js');

		var CONFIG = {
			"sites_server": 'http://api.allevents.nyc',
			"path": '/www/bot-nyc',
			"path_in": '',
			"path_out": ''
		};

		var SITES = [];

		var CASPER = require('casper').create({
			waitTimeout: 10000,
			stepTimeout: 1000,
			retryTimeout: 100,
			verbose: true,
			exitOnError: false,
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
				// CASPER.log('onWaitTimeout\': "' + (SITE ? SITE.link : '(site not defined)') + '" : ' + timeout + 'ms', "error");
				// CASPER.clear();
				// CASPER.page.stop();
			},
			onStepTimeout: function(timeout, step) {
				// CASPER.log('onStepTimeout\': "' + (SITE ? SITE.link : '(site not defined)') + '" : ' + timeout + 'ms', "error");
				// CASPER.clear();
				// CASPER.page.stop();
			},
			onResourceReceived: function(timeout, step) {
				//CASPER.log( 'onResourceReceived\': "' + ( SITE ? SITE.link : '(site not defined)' ) + '" : ' + timeout + 'ms', "info" );
			},
			clientScripts: [
				CONFIG.path + "/remote_assets/vendor/jquery.js",
				CONFIG.path + "/remote_assets/vendor/underscore.js",
				CONFIG.path + "/remote_assets/vendor/sugar.js",
				CONFIG.path + "/remote_assets/custom/tools.js",
				CONFIG.path + "/remote_assets/custom/site.js"
			]
		});
		// events
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
		CASPER.iteration = '0';
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

		CASPER.on('error', function(msg, backtrace) {
			CASPER.console.error(msg);
		});
		CASPER.on('run.complete', function() {
			//CASPER.console.warn('Test completed');
			//CASPER.exit();
		});
		CASPER.on('remote.message', function(msg) {
			CASPER.console.log('		' + msg, 'error');
		});
		// CASPER.on('remote.callback', function(requestData, request) {
		// 	request.abort(requestData);
		// 	return false;
		// });


// CRAWL
// bot.js crawls list of files, from /sites api
// go.js crawls one, posted to self (webserver)
CASPER.console.warn('CASPER.cli.options');
CASPER.console.warn(CASPER.cli.options);
CASPER.console.info( 'Crawl #'+CASPER.iteration +' '+ DT.getFullYear() + '.' + FUN.pad(DT.getMonth()+1) + '.' + FUN.pad(DT.getDate()) + ' ' + FUN.pad(DT.getHours()) + ':' + FUN.pad(DT.getMinutes()) + ':' + FUN.pad(DT.getSeconds()) + ':' + DT.getMilliseconds() );

///////////////////////////////////////////////////////////////////
// GET /sites
///////////////////////////////////////////////////////////////////
CASPER.start();
CASPER.thenOpen(CONFIG.sites_server+'/sites', {
	method: 'get'
}, function(headers) {
	// get
	var all = JSON.parse(CASPER.getPageContent());
	if (!all.data || !all.data.sites) {
		CASPER.console.error('!all.data || !all.data.sites');
		return false;
	}

	// sites
	var SITES = [];
	for (var s in all.data.sites) {
		SITES.push(all.data.sites[s]);
	}
	CASPER.console.log('SITES: ' + (typeof SITES) );

	// site
	CASPER.eachThen(SITES, function(response) {
		var SITE = {};
		SITE = response.data;
		CASPER.console.log('SITE: ' + (typeof SITE) );
		CASPER.console.log('site.link: ' + SITE.link );
		CASPER.console.log('site.elements.item: ' + SITE.elements.item );

		CASPER.thenOpen(SITE.link, function(headers) {
			CASPER.waitFor(function() {
				return SITE.items = CASPER.evaluate(function(site) {
					
					return casperJsHaunt(site);

				},SITE);
			}, function(data) {
				///////////////////////////////////////////////////////////////////
				///////////////////////////////////////////////////////////////////
				// SUCCESS
				CASPER.console.info('Found '+(SITE.items.length||0)+' items');
				if (SITE.items) {
					var post = {};
					post.site = SITE;
					// post
					CASPER.thenOpen(CONFIG.sites_server+'/site', {
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