// SETUP
// same bot.js as go.js

	var DT = new Date();
	var FS = require('fs');
	var FUN = require('./node_custom/fun.js');

	var CONFIG = {
		"api_host": 'http://api.allevents.nyc',
		"path_root": '',
		"port":5080,
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
			CONFIG.path_root + "/remote_assets/vendor/jquery.js",
			CONFIG.path_root + "/remote_assets/vendor/underscore.js",
			CONFIG.path_root + "/remote_assets/vendor/sugar.js",
			CONFIG.path_root + "/remote_assets/custom/tools.js",
			CONFIG.path_root + "/remote_assets/custom/site.js"
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


// GO
// bot.js crawls list of files, from /sites api
// go.js crawls one, posted to self (webserver)
var GO = {};
GO.site = {};
GO.requests = [];
GO.written = 0;
GO.haunt = function(req, res) {

	GO.site = {};
	GO.site.id = GO.written+1;
	GO.site.url = req.post.url;
	CASPER.echo('START '+GO.site.id);
	
	// GO
	CASPER.echo('= '+GO.site.url);
	CASPER.thenOpen(GO.site.url,function(){

		CASPER.waitFor(function() {
			return GO.site.data = CASPER.evaluate(function(site) {
				var returned = $('#casperJsDone').get(0) ? $('#casperJsDone').get(0).innerText : '';
				console.log('returned...', returned);
				try { 
					var data = JSON.parse(returned);
					return data;
				} catch(e) {
					return false;
				}
			}, GO.site);
		}, function(data) {
				// SUCCESS
				CASPER.echo('OK');
				res.statusCode = 200;
				res.write(JSON.stringify([{id:CONFIG.iteration,title:JSON.stringify(GO.site.data,null,"\t")}]));
				res.close();
			
		}, function(data) {
				// FAIL
				CASPER.echo('no');
				res.statusCode = 200;
				res.write(JSON.stringify([{id:CONFIG.iteration,title:'no :('}]));
				res.close();
		}, 
		11000 );

			
	});
	
	// DONE
	CASPER.run(function(){
		// current
		GO.requests[GO.written] = null;
		GO.written++;
		CASPER.echo('DONE '+GO.written);
		CASPER.clear();
		// next
		if (GO.requests[GO.written]) {
			var request = GO.requests[GO.written].req;
			var response = GO.requests[GO.written].res;
			console.log('respond() from casper.run')
			CASPER.pro.respond(request,response);
		}
	});

};




// SERVE
CASPER.start();
var server = require('webserver').create(),
		system = require('system'),
		port  =  5080;
var service = server.listen(port, function(request, response) {
	if (request.method == 'POST' && request.post.url){
		// next
		GO.requests.push({req:request,res:response});
		
		// restart
		if ((GO.requests.length-GO.written)==1) {
			console.log('respond() from server.listen')
			GO.haunt(request,response);
		}
		
	} else {
		// serve index
		response.statusCode = 200;
		response.setHeader('Content-Type', 'text/html; charset=utf-8');
		response.write(FS.read('html/index.tpl'));
		response.close();
	}

});
if(service) {
	console.log("CasperJS started - http://localhost:" + server.port);
}










