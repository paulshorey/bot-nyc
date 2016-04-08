// SETUP
// same bot.js as go.js

	var DT = new Date();
	var FS = require('fs');
	var FUN = require('./node_custom/fun.js');

	var CONFIG = {
		"sites_server": 'http://api.allevents.nyc',
		"path_root": '',
		"path_in": '',
		"path_out": '',
		"port":80,
		"iteration":0
	};
	CONFIG.path_root = FS.absolute(require('system').args[3]).split('/');
	CONFIG.path_root.pop();
	CONFIG.path_root = CONFIG.path_root.join('/');

	var POSTER = require('casper').create({
		waitTimeout: 10000,
		stepTimeout: 1000,
		retryTimeout: 100,
		verbose: true,
		exitOnError: false
	});

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
			// CASPER.log('onWaitTimeout\': "' + (site ? site.data.link : '(site not defined)') + '" : ' + timeout + 'ms', "error");
			// CASPER.clear();
			// CASPER.page.stop();
		},
		onStepTimeout: function(timeout, step) {
			// CASPER.log('onStepTimeout\': "' + (site ? site.data.link : '(site not defined)') + '" : ' + timeout + 'ms', "error");
			// CASPER.clear();
			// CASPER.page.stop();
		},
		onResourceReceived: function(timeout, step) {
			//CASPER.log( 'onResourceReceived\': "' + ( site ? site.data.link : '(site not defined)' ) + '" : ' + timeout + 'ms', "info" );
		},
		clientScripts: [
			CONFIG.path_root + "/remote_assets/vendor/jquery.js",
			CONFIG.path_root + "/remote_assets/vendor/underscore.js",
			CONFIG.path_root + "/remote_assets/vendor/sugar.js",
			CONFIG.path_root + "/remote_assets/custom/tools.js",
			CONFIG.path_root + "/remote_assets/custom/site.data.js"
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
	CASPER.on('remote.message', function(msg) {
		// ignore site's console.logs, only show ours
		if (msg.substr(0,2)!='##') {
			return false;
		}
		msg = msg.substr(3);
		CASPER.console.info('		' + msg, 'error');
	});
	CASPER.on('error', function(msg, backtrace) {
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

	// CONFIG (amended after CASPER ready)
	if (CASPER.cli.has("port")) {
		CONFIG.port = CASPER.cli.get("port");
	}
	if (CASPER.cli.has("iteration")) {
		CONFIG.iteration = CASPER.cli.get("iteration");
	}

	// CASPER.console.info( 'Crawl #'+CONFIG.iteration +' '+ DT.getFullYear() + '.' + FUN.pad(DT.getMonth()+1) + '.' + FUN.pad(DT.getDate()) + ' ' + FUN.pad(DT.getHours()) + ':' + FUN.pad(DT.getMinutes()) + ':' + FUN.pad(DT.getSeconds()) + ':' + DT.getMilliseconds() );


/*
	1. START
*/
CASPER.start();
CASPER.thenOpen(CONFIG.sites_server+'/sites', {
	method: 'get'
}, function(headers) {

	// sites
	var sites = [];
	var entries = JSON.parse(CASPER.getPageContent());
	if (!entries.data) {
		CASPER.console.error('no sites');
		return false;
	}
	for (var s in entries.data.sites) {
		sites.push(entries.data.sites[s]);
	}
	CASPER.console.log('sites: ' + (typeof sites) );

	// site
	CASPER.eachThen(sites, function(response) {
		var site = {};
		site.data = response.data;
		CASPER.console.log('site: ' + (typeof site) );
		CASPER.console.log('site.data.link: ' + site.data.link );
		CASPER.console.log('site.data.elements.item: ' + site.data.elements.item );

		CASPER.thenOpen(site.data.link, function(headers) {
			
			/*
				>>
			*/
			BOT.wait();

		});

	});


});
CASPER.run();
// POSTER.run();
// POSTER.start();


/*
	2. WAIT
*/
var BOT = {};
BOT.wait = function(){

	CASPER.wait(1000);
	CASPER.waitFor(function() {

		// parsed
		var parsed = CASPER.evaluate(function(site) {
			return casperJsHaunt(site);
		},site);

		// site.data.items
		if (parsed.items && parsed.items.length) {
			site.data.items = parsed.items;
			return true;
		}

	}, function(data) {

		// SAVE items
		BOT.save(data);

		// MORE items
		if (site.data.elements.more) {
			CASPER.thenClick(site.data.elements.more, function(){
				BOT.wait();
			});
		}
		
	}, function(data) {
		BOT.save(data);
	}, 
	30000 );

};


/*
	3. SAVE
*/
BOT.save = function() {

	CASPER.console.info('Found '+(site.data.items.length||0)+' items');
	CASPER.console.log(JSON.stringify(site.data.items));
	// for (var it in site.data.items) {
	// 	CASPER.console.log(site.data.items[it].text.substr(0,33));
	// }

	if (site.data.items) {
		var post = {};
		post.site = site;
		// post
		// POSTER.open(CONFIG.sites_server+'/site', {
		// 	method: 'post',
		// 	data: JSON.stringify(post, null, '\t'),
		// 	headers: {
		// 		'Content-type': 'application/json'
		// 	}
		// }, function(headers) {
		// 	CASPER.console.info('POSTED to /site');
		// });
	} else {
		CASPER.console.warn(JSON.stringify(data));
	}

};