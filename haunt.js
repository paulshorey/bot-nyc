// UPPERCASE global scope
// same bot.js as go.js

	var DEBUG = true;
	var SYSTEM = require('system');
	var OS = SYSTEM.os;
	var DT = new Date();
	var FS = require('fs');
	var FUN = require('./node_custom/fun.js');
	var deep_map = function(obj, f, ctx) {
		if (Array.isArray(obj)) {
		    return obj.map(function(val, key) {
		        return (typeof val === 'object') ? deep_map(val, f, ctx) : f.call(ctx, val, key);
		    });
		} else if (typeof obj === 'object') {
		    var res = {};
		    for (var key in obj) {
		        var val = obj[key];
		        if (typeof val === 'object') {
		            res[key] = deep_map(val, f, ctx);
		        } else {
		            res[key] = f.call(ctx, val, key);
		        }
		    }
		    return res;
		} else {
		    return obj;
		}
	};

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
			// CASPER.log('onWaitTimeout\': "' + (site ? EACH.site.link : '(site not defined)') + '" : ' + timeout + 'ms', "error");
			// CASPER.clear();
			// CASPER.page.stop();
		},
		onStepTimeout: function(timeout, step) {
			// CASPER.log('onStepTimeout\': "' + (site ? EACH.site.link : '(site not defined)') + '" : ' + timeout + 'ms', "error");
			// CASPER.clear();
			// CASPER.page.stop();
		},
		onResourceReceived: function(timeout, step) {
			//CASPER.log( 'onResourceReceived\': "' + ( site ? EACH.site.link : '(site not defined)' ) + '" : ' + timeout + 'ms', "info" );
		},
		clientScripts: [
			CONFIG.path_root + "/remote_assets/modified/jquery.js",
			CONFIG.path_root + "/remote_assets/vendor/sugar.js",
			CONFIG.path_root + "/remote_assets/custom/uu.js",
			CONFIG.path_root + "/remote_assets/custom/parse.js",
			CONFIG.path_root + "/remote_assets/custom/crawl.js"
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
	CASPER.on('remote.message', function(msg, etc) {
		// ignore site's console.logs, only show ours
		if (msg.substr(0,3)=='###') {
			msg = msg.substr(4);
			CASPER.console.warn('		' + msg, 'error');
		}
		// ignore site's console.logs, only show ours
		if (msg.substr(0,2)=='##') {
			msg = msg.substr(3);
			CASPER.console.info('		' + msg, 'error');
		}
		if (msg.substr(0,2)=='# ') {
			msg = msg.substr(2);
			CASPER.console.log('		' + msg, 'error');
		}
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
	//CASPER.console.log(OS.name);

/*
	4. POST
*/
var BOT = {};
BOT.post = function(url, data) {

	var POSTER = require('casper').create({
		waitTimeout: 10000,
		stepTimeout: 1000,
		retryTimeout: 100,
		verbose: true,
		exitOnError: false,
		onWaitTimeout: function(timeout, step) {
		},
		onStepTimeout: function(timeout, step) {
		},
		onResourceReceived: function(timeout, step) {
		},
	});
	POSTER.start();
	POSTER.thenOpen(url, {
		method: 'post',
		data: JSON.stringify(data, null, '\t'),
		encoding: 'utf8',
		headers: {
			'Content-type': 'application/json; charset=utf-8'
		}
	}, function(headers) {

		POSTER.waitFor(function() {
			return POSTER.evaluate(function() {
				window.console.log('## POSTED to /site');
				return true;
			});
		});
		CASPER.console.info('POSTED to /site');

	});
	POSTER.run();

}


/*
	3. SAVE
*/
BOT.save = function(error) {

	CASPER.console.info('Found '+(EACH.items?EACH.items.length||0:0)+' items');
	// for (var it in EACH.items) {
	// 	CASPER.console.log(EACH.items[it].text.substr(0,33));
	// }

	if (EACH.items) {
		var post = {items:[]};
		for (var it in EACH.items) {
			// MODEL
			// item temporary stack
			var its = EACH.items[it];
			//CASPER.console.warn(JSON.stringify(its,null,'\t'));
			// item
			var item = {};
				item.text = '<span>'+its.texts[0]+'</span> ';
				if (its.texts[1]) {
					item.text += '<span>'+its.texts[1]+'</span> ';
				}
				if (its.texts[2]) {
					item.text += '<span>'+its.texts[2]+'</span> ';
				}
				item.image = its.images[0];
				item.link = its.links[0] || EACH.site.link;
				item.time = its.time;
				item.date = '<span>'+its.dates[0]+'</span> <span>'+its.times[0]+'</span> ';
				item.scenes = '';
				for (var sc in EACH.site.scenes) {
					var scene = EACH.site.scenes[sc];
					item.scenes += '<span url="'+scene.url+'">'+scene.title+'</span> ';
				}
				item.categories = '';
				for (var sc in EACH.site.categories) {
					var category = EACH.site.categories[sc];
					item.categories += '<span url="'+category.url+'">'+category.title+'</span> ';
				}
				item.source = EACH.site.title;
				item.source = item.source.split(' | ').reverse().join(' | ');
				item.source_host = EACH.site.host;
				item.source_link = EACH.site.link;
				item.source_title = item.source;
				item = deep_map(item, function(val, key){
					if (typeof val == 'string') {
						return unescape(encodeURIComponent(val));
					}
					return val;
				});
				if (DEBUG) {
					CASPER.console.info(JSON.stringify(item,null,'\t'));
				}
			// conform to api
			if (item.text && item.date) {
				item.text = item.text.replace(item.date,'');
			}
			//CASPER.console.info(JSON.stringify(item,null,'\t'));
			// save
			post.items.push(item);
		}
		// post
		BOT.post(CONFIG.api_host+'/items', post);

		//CASPER.console.info(JSON.stringify(EACH,null,"\t"));
	} else {
		CASPER.console.warn(JSON.stringify(error));
	}

};

/*
	2. WAIT
*/
BOT.wait = function(){
	CASPER.console.info(JSON.stringify(CONFIG,null,'\t'));
	// limit
	CASPER.console.warn('wait '+EACH.waited);
	if (EACH.waited>=10) {
		return false;
	}
	EACH.waited++;

	// start
	CASPER.waitFor(function() {

		// each evaluate
		var each = CASPER.evaluate(function(each) {
			return window.casbot.crawl(each);
		},EACH);

		// EACH evaluated
		if (each && each.items && each.items.length) {
			EACH = each;
			return true;
		}

	}, function(data) {

		// SAVE items
		BOT.save(data);
		CASPER.wait(1000);

		// MORE items
		// if (EACH.selectors.more) {
		// 	CASPER.console.log('more = "'+EACH.selectors.more+'"');
		// 	CASPER.thenClick(EACH.selectors.more, function(){
		// 		BOT.wait();
		// 	});
		// }
		
	}, function(data) {
		CASPER.console.error('BOT.wait: '+EACH.waited);
	}, 
	11000 );

};


/*
	1. START
*/
var EACH = {};
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
	CASPER.console.log('sites: ' + sites.length );

	// EACH
	CASPER.eachThen(sites, function(response) {
		EACH.more = '';
		EACH.waited = 0;
		EACH.site = response.data;
		CASPER.console.log('EACH.site.link: ' + EACH.site.link );
		CASPER.console.log('EACH.site.selectors.item: ' + EACH.site.selectors.item );
		CASPER.console.log('EACH.site.selectors.dates: ' + JSON.stringify(EACH.site.selectors.dates) );
		CASPER.console.log('EACH.site.selectors.more: ' + EACH.site.selectors.more );
		CASPER.thenOpen(EACH.site.link, function(headers) {
			
			/*
				>>
			*/
			BOT.wait();

		});

	});


});
CASPER.run();