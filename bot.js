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
		if (CONFIG.test) {
			CASPER.console.error('		Error: ' + JSON.stringify(error, null, " ") + '\n' + JSON.stringify(notes[0], null, " "), 'error');
		}
	});
	CASPER.on('http.status.404', function(resource) {
		if (CONFIG.test) {
			CASPER.console.error('		404 error: ' + resource.url, 'error');
		}
	});
	CASPER.on('http.status.500', function(resource) {
		if (CONFIG.test) {
			CASPER.console.error('		500 error: ' + resource.url, 'error');
		}
	});
	CASPER.on('complete.error', function(err) {
		if (CONFIG.test) {
			CASPER.die("		Complete callback has failed: " + err);
		}
	});
	CASPER.on('remote.message', function(msg, etc) {
		if (CONFIG.test) {
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
	if (CASPER.cli.has("test")) {
		CONFIG.test = CASPER.cli.get("test");
	}
	if (CASPER.cli.has("list")) {
		CONFIG.list = CASPER.cli.get("list");
	}

	// CASPER.console.info( 'Crawl #'+CONFIG.iteration +' '+ DT.getFullYear() + '.' + FUN.pad(DT.getMonth()+1) + '.' + FUN.pad(DT.getDate()) + ' ' + FUN.pad(DT.getHours()) + ':' + FUN.pad(DT.getMinutes()) + ':' + FUN.pad(DT.getSeconds()) + ':' + DT.getMilliseconds() );
	//CASPER.console.log(OS.name);


/*
	4. POST
*/
var BOT = {};
var POSTERS = {};
BOT.post = function(url, data) {
	if (data.items.length) {
		try {
			var pid = FUN.hash_letters(11);
			POSTERS[pid] = require('casper').create({
				waitTimeout: 20000,
				stepTimeout: 2000,
				retryTimeout: 200,
				verbose: true,
				exitOnError: false,
				onStepTimeout: function(timeout, step) {
					if (POSTERS[pid]) {
						CASPER.console.warn('Failed: '+data.items.length+' items at '+data.items[0].source_link);
						CASPER.console.log(' ');
						delete POSTERS[pid];
					}88
				},
				onStepComplete: function(timeout, step) {
					if (POSTERS[pid]) {
						CASPER.console.info('Saved '+data.items.length+' items for site '+data.items[0].source_link);
						CASPER.console.log(' ');
						delete POSTERS[pid];
					}
				}
			});
			POSTERS[pid].start();
			POSTERS[pid].thenOpen(
				url, 
				{
					method: 'post',
					data: JSON.stringify(data, null, '\t'),
					encoding: 'utf8',
					headers: {
						'Content-type': 'application/json; charset=utf-8'
					}
				}, function(headers) {
					CASPER.console.info('POST headers:');
					CASPER.console.info(JSON.stringify(headers));
					POSTERS[pid].waitFor(function() {
						return POSTERS[pid].evaluate(function() {
							return true;
						});
					});
				}
			);
			POSTERS[pid].run();

		} catch(e) {
		}
	} else {
		CASPER.console.warn('POST ? no data ? '+JSON.stringify(data));
	}

}


/*
	3. SAVE
*/
BOT.save = function(error) {

	if (EACH.items) {
		var post = {items:[]};
		for (var it in EACH.items) {
			// MODEL
			// item temporary stack
			var its = EACH.items[it];
			//CASPER.console.warn(JSON.stringify(its,null,'\t'));
			// item
			var item = {};
				item.texts = its.texts.splice(0,3);
				item.image = its.images[0] || '';
				item.link = its.links[0] || EACH.site.link;
				item.timestamp = its.time;
				item.featured_images = its.featured_images;
				item.featured = its.featured;
				item.time = its.times[0];
				item.date = its.dates[0];
				item.price = its.price;
				item.scene = '';
				for (var sc in EACH.site.scenes) {
					var scene = EACH.site.scenes[sc];
					item.scene += '<span>'+scene.title+'</span> ';
				}
				item.category = '';
				for (var sc in EACH.site.categories) {
					var category = EACH.site.categories[sc];
					item.category += '<span>'+category.title+'</span> ';
				}
				item.source = EACH.site.title;
				item.source = item.source.split(' | ').reverse().join(' | ');
				var matched = EACH.site.host.match(/[\/|\.]+([a-zA-Z0-9]+)[\.]{1}([a-z]+)$/);
				item.source_host = matched[1]+'.'+matched[2];
				item.source_link = EACH.site.link;
				item.source_title = item.source;
				item.random = Math.ceil(Math.random()*10000000); //FUN.hash_int(its.texts[0]+its.texts[1]+its.texts[2]);
				item = deep_map(item, function(val, key){
					if (typeof val == 'string') {
						return unescape(encodeURIComponent(val));
					}
					return val;
				});
			// conform to api
			if (item.text && item.date) {
				item.text = item.text.replace(item.date,'');
			}
			// save
			post.items.push(item);
		}
		// post
		BOT.post(CONFIG.api_host+'/items', post);

		CRAWLED[ EACH.site.link ] = post.items.length;
		CASPER.console.info('Post '+post.items.length+' items');
		
	} else {
		CASPER.console.error('Post failed: '+error+'');
		CASPER.console.log(' ');
	}

};

/*
	2. WAIT
*/
BOT.wait = function(){
	// limit
	EACH.waited++;
	if (EACH.waited>3) {
		return false;
	}
	CASPER.console.log('Waiting '+EACH.waited);

	// start
	CASPER.waitFor(function() {

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

		// SAVE items
		BOT.save(data);

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
	10100 );

};


/*
	1. START
*/
var CRAWLED = {};
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

	// EACH
	CASPER.eachThen(sites, function(response) {
		EACH.more = '';
		EACH.waited = 0;
		EACH.site = response.data;

		// GO
		if (!CONFIG.list && !CONFIG.test && !CRAWLED[ EACH.site.link ]) {
			// all
			CASPER.console.log('\nOpening... ' + EACH.site.categories[0].title + ' ...' + EACH.site.link );
			CASPER.thenOpen(EACH.site.link, function(headers) {
				BOT.wait();
				CASPER.wait(5000);
			});
		} else if (CONFIG.test && EACH.site.link.indexOf(CONFIG.test)!=-1) {
			// one
			CASPER.console.log('\nOpening... ' + JSON.stringify(EACH.site) );
			CASPER.thenOpen(EACH.site.link, function(headers) {
				BOT.wait();
				CASPER.wait(5000);
			});
		} else if (CONFIG.list) {
			// none -- list only
			CASPER.console.log('\nOpening... ' + EACH.site.categories[0].title + ' ...' + EACH.site.link );
		}

	});


});
CASPER.run();