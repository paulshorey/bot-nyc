// UPPERCASE global scope
// same bot.js as go.js

	var DEBUG = true;
	var SYSTEM = require('system');
	var OS = SYSTEM.os;
	var DT = new Date();
	var FS = require('fs');
	var FUN = require('./node_custom/fun.js');

	var CONFIG = {
		"api_host": 'http://api.allevents.nyc',
		"path_root": '',
		"port":80,
		"iteration":0
	};
	if (OS.name=='mac') {
		CONFIG.api_host = 'http://localhost:1080';
	}
	CONFIG.path_root = FS.absolute(require('system').args[3]).split('/');
	CONFIG.path_root.pop();
	CONFIG.path_root = CONFIG.path_root.join('/');

	var CASPER = require('casper').create({
		waitTimeout: 20000,
		stepTimeout: 2000,
		retryTimeout: 200,
		verbose: true,
		exitOnError: false,
		log_statuses: ['warning', 'error', 'info','log'],
		viewportSize: {
			width: 1440,
			height: 900
		},
		pageSettings: {
			"userAgent": 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.10 (KHTML, like Gecko) Chrome/23.0.1262.0 Safari/537.10',
			"loadImages": true,
			"loadPlugins": true,
			"webSecurityEnabled": false,
			"ignoreSslErrors": true
		},
		onWaitTimeout: function(timeout, step) {
			//CASPER.console.error('		onWaitTimeout: ' + step, 'error');
			// CASPER.log('onWaitTimeout\': "' + (site ? EACH.site.link : '(site not defined)') + '" : ' + timeout + 'ms', "error");
			// CASPER.clear();
			// CASPER.page.stop();
		},
		onStepTimeout: function(timeout, step) {
			//CASPER.console.error('		onStepTimeout: ' + step, 'error');
			// CASPER.log('onStepTimeout\': "' + (site ? EACH.site.link : '(site not defined)') + '" : ' + timeout + 'ms', "error");
			// CASPER.clear();
			// CASPER.page.stop();
		},
		onResourceReceived: function(timeout, step) {
			//CASPER.console.error('		onResourceReceived: ' + step, 'error');
			//CASPER.log( 'onResourceReceived\': "' + ( site ? EACH.site.link : '(site not defined)' ) + '" : ' + timeout + 'ms', "info" );
		},
		clientScripts: [
			CONFIG.path_root + "/remote_assets/modified/es6.js",
			CONFIG.path_root + "/remote_assets/modified/jquery.js",
			CONFIG.path_root + "/remote_assets/vendor/sugar.js",
			CONFIG.path_root + "/remote_assets/custom/uu.js",
			CONFIG.path_root + "/remote_assets/custom/parse.js",
			CONFIG.path_root + "/remote_assets/custom/crawl.js"
		]
	});
	// events
	CASPER.on("page.error", function(error, notes) {
		if (DEBUG) {
			CASPER.console.error('		Error: ' + JSON.stringify(error, null, " ") + '\n' + JSON.stringify(notes, null, " "));
		}
	});
	CASPER.on('http.status.404', function(resource) {
		if (DEBUG) {
			CASPER.console.error('		404 error: ' + resource.url, 'error');
		}
	});
	CASPER.on('http.status.500', function(resource) {
		if (DEBUG) {
			CASPER.console.error('		500 error: ' + resource.url, 'error');
		}
	});
	CASPER.on('complete.error', function(err) {
		CASPER.die("		Complete callback has failed: " + err);
	});
	CASPER.on('remote.message', function(msg, etc) {
		// ignore site's console.logs, only show ours
		if (msg.substr(0,3)=='###') {
			msg = msg.substr(4);
			CASPER.console.warn('		' + msg);
		}
		// ignore site's console.logs, only show ours
		if (msg.substr(0,2)=='##') {
			msg = msg.substr(3);
			CASPER.console.info('		' + msg);
		}
		if (msg.substr(0,2)=='# ') {
			msg = msg.substr(2);
			CASPER.console.log('		' + msg);
		}
	});
	CASPER.on('error', function(msg, backtrace) {
		// this is a casper error, not remote
		CASPER.console.error(msg);
	});
	CASPER.on('run.complete', function() {
		//CASPER.console.warn('Test completed');
		//CASPER.exit();
	});
	// CASPER.on('remote.callback', function(requestData, request) {
	// 	request.abort(requestData);
	// 	return false;
	// });
	// helpers
	CASPER.console = {};
	CASPER.console.html = '';
	CASPER.console.date = '';
	CASPER.console.write = function(message, status) {
		// start each day
		if (CASPER.console.date != DT.getFullYear() + '.' + FUN.pad(DT.getMonth()+1) + '.' + FUN.pad(DT.getDate())) {
			CASPER.console.html = '';
			CASPER.console.date = DT.getFullYear() + '.' + FUN.pad(DT.getMonth()+1) + '.' + FUN.pad(DT.getDate());
		}
		// format
		if (typeof message == 'object') {
			message = JSON.stringify(message, null, ' ').replace(/[\n\r\t]/g,'');
		} else if (typeof message == 'function') {
			message = JSON.stringify(message, null, ' ').replace(/[\n\r\t]/g,'');
		} else if (typeof message == 'string') {
			//message = message.trim();
			//message = message.replace(/[\n\r\t]/g,'');
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

	// CONFIG (amended after CASPER ready)
	if (CASPER.cli.has("port")) {
		CONFIG.port = CASPER.cli.get("port");
	}
	if (CASPER.cli.has("iteration")) {
		CONFIG.iteration = CASPER.cli.get("iteration");
	}
	if (CASPER.cli.has("list")) {
		CONFIG.list = CASPER.cli.get("list"); // just list the sites, don't actually crawl them
	}
	if (CASPER.cli.has("test")) {
		CONFIG.test = CASPER.cli.get("test"); // test crawl one site
		DEBUG = true;
	}
	if (CASPER.cli.has("squash")) {
		CONFIG.list = CASPER.cli.get("squash"); // enable DEBUG without changing anything else
		DEBUG = true;
	}

	// CASPER.console.info( 'Crawl #'+CONFIG.iteration +' '+ DT.getFullYear() + '.' + FUN.pad(DT.getMonth()+1) + '.' + FUN.pad(DT.getDate()) + ' ' + FUN.pad(DT.getHours()) + ':' + FUN.pad(DT.getMinutes()) + ':' + FUN.pad(DT.getSeconds()) + ':' + DT.getMilliseconds() );
	//CASPER.console.log(OS.name);

/*
	2. CRAWL
*/
var BOT = {};
BOT.wait = function(){
	// limit
	EACH.waited++;
	if (EACH.waited>3) {
		return false;
	}
	CASPER.console.log('Waiting '+EACH.waited);

	// start
	CASPER.waitFor(
		function() {

			// EACH meta
			EACH.CONFIG = CONFIG; // for evaluate post, call local or remote api
			EACH.DEBUG = DEBUG = true; // enable console.log s
			EACH.crawled = 0; // for this, allow duplicate call if didn't get results first time

			// each evaluate
			var each = CASPER.evaluate(function(each) {
				if (!window.casbot) {
					return false;
				}
				return window.casbot.crawl(each);
			}, EACH);

			// EACH evaluated
			if (each && each.items && each.items.length) {
				EACH = each;
				return true;
			}

		}, function(data) {

			// SAVE
			// now done in client

			// MORE items
			if (EACH.selectors.more) {
				CASPER.thenClick(EACH.selectors.more, function(){
					BOT.wait();
				});
			}
			
		}, function(error) {
			CASPER.console.error('Read failed: '+error+'');
			CASPER.console.log(' ');
		}, 
		33333 
	);

};


/*
	1. START
*/
var EACH = {crawled:{}};
CASPER.start();
CASPER.thenOpen(CONFIG.api_host+'/sites', {
	method: 'get'
}, function(headers) {

	// sites
	var entries = JSON.parse(CASPER.getPageContent());
	if (!entries.data) {
		CASPER.console.error('no sites data');
		return false;
	}
	var sites = [];
	for (var s in entries.data) {
		sites.push(entries.data[s]);
	}

	// EACH
	CASPER.eachThen(sites, function(response) {
		EACH.more = '';
		EACH.waited = 0;
		EACH.site = response.data;

		// GO
		if (!CONFIG.list && !CONFIG.test && !EACH.crawled[ EACH.site.link ]) {
			// all - production
			CASPER.console.log('\nOpening all... ' + EACH.site.categories[0].title + ' ...' + EACH.site.link );
			CASPER.thenOpen(EACH.site.link, function(headers) {
				BOT.wait();
			});
		} else if (CONFIG.test && EACH.site.link.indexOf(CONFIG.test || CONFIG.squash)!=-1) {
			// one - to test
			CASPER.console.log('\nOpening test... ' + JSON.stringify(EACH.site) );
			CASPER.thenOpen(EACH.site.link, function(headers) {
				BOT.wait();
			});
		} else if (CONFIG.list) {
			// none -- list only
			CASPER.console.log('\nOpening list... ' + EACH.site.categories[0].title + ' ...' + EACH.site.link );
		}

	});


});
CASPER.run();