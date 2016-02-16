var DT = new Date();
var FS = require('fs');

// var pro = process = {};
// pro.fs = FS;
// pro.q = require('q');
// pro.fun = require("./node_custom/fun.js");
// pro.console = require("./node_custom/console.js").console;
// pro.console.log('hello');

var APP = {
	"sites_server": 'http://localhost:8000/sites',
	"path": '/www/bot',
	"path_in": '',
	"path_out": ''
};

var SITES = [];

var CASPER = require('casper').create({
	waitTimeout: 3000,
	stepTimeout: 3000,
	verbose: true,
	logLevel: 'debug',
	log_statuses: ['warning', 'error', 'info'],
	viewportSize: {
		width: 2000,
		height: 2000
	},
	pageSettings: {
		"userAgent": 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.10 (KHTML, like Gecko) Chrome/23.0.1262.0 Safari/537.10',
		"loadImages": false,
		"loadPlugins": false,
		"webSecurityEnabled": false,
		"ignoreSslErrors": true
	},
	onWaitTimeout: function(timeout, step) {
		this.log('onWaitTimeout\': "' + (this.site ? this.site.meta.url : '(site not defined)') + '" : ' + timeout + 'ms', "error");
		this.clear();
		this.page.stop();
	},
	onStepTimeout: function(timeout, step) {
		this.log('onStepTimeout\': "' + (this.site ? this.site.meta.url : '(site not defined)') + '" : ' + timeout + 'ms', "error");
		this.clear();
		this.page.stop();
	},
	onResourceReceived: function(timeout, step) {
		//this.log( 'onResourceReceived\': "' + ( this.site ? this.site.meta.url : '(site not defined)' ) + '" : ' + timeout + 'ms', "info" );
	},
	clientScripts: [
		APP.path + "/lib/jquery.js",
		APP.path + "/lib/underscore.js",
		APP.path + "/lib/uu.js"
	]
});

CASPER.start('http://localhost:8000/sites');
CASPER.then(function(data) {
	SITES = JSON.parse(this.getPageContent());
	this.echo(SITES);


	CASPER.start();
	CASPER.eachThen(SITES, function(site) {
		this.site = {};
		this.site.items = {};
		this.site.meta = JSON.parse(JSON.stringify(site.data));
		this.site.meta.url = this.site.meta.protocol + this.site.meta.domain + this.site.meta.path;

		this.thenOpen(this.site.meta.url, function(headers) {
			console.log('waitFor?:', this.site.meta.item_selector);
			CASPER.waitForSelector(this.site.meta.item_selector, function() {
				console.log('evaluate...');
				this.site.items = this.evaluate(function(site) {

					var itemsindex = [];
					var items = [];
					$(site.meta.item_selector).each(function() {
						console.log('each selector', site.meta.item_selector);

						///////////////////////////////////////////////////////////////////
						// ITEM
						var item = {};

						///////////////////////////////////////////////////////////////////
						// IMG
						item.img = {};
						item.img.src = '';
						item.img.width = 0;

						// this is img
						if ($(this).is('img')) {
							// img (new) vs img (old)
							img = {
								"src": uu.val($(this).attr('src')),
								"width": uu.val($(this).width())
							};
							if (img.src && img.width > item.img.width) {
								// new is better
								item.img = img;
								// format
								item.img.src = uu.parseUrl(item.img.src);
							}
						} else {
							// child <img>s
							$(this).find('img').each(function() {
								// img (new) vs img (old)
								img = {
									"src": uu.val($(this).attr('src')),
									"width": uu.val($(this).width())
								};
								if (img.src && img.width > item.img.width) {
									// new is better
									item.img = img;
									// format
									//item.img.src = uu.parseUrl(item.img.src);
								}
							});
							// child background-images
							if (!item.img.src || item.img.width < 50) {
								$(this).find('*').each(function() {
									// img (new) vs img (old)
									img = {
										"src": uu.val($(this).css('background-image')),
										"width": uu.val($(this).width())
									};
									if (img.src && img.width > item.img.width) {
										// new is better
										item.img = img;
										// format
										item.img.src = uu.parseUrl(item.img.src);
									}
								});
							}
							// background-image
							if (!item.img.src || item.img.width < 50) {
								// img (new) vs img (old)
								img = {
									"src": uu.val($(this).css('background-image')),
									"width": uu.val($(this).width())
								};
								if (img.src && img.width > item.img.width) {
									// new is better
									item.img = img;
									// format
									item.img.src = uu.parseUrl(item.img.src);
								}
							}
						}
						if (!item.img.src) {
							item.img = {};
						}

						///////////////////////////////////////////////////////////////////
						// DTTLE / DESCRIPDTON
						text = uu.strip_tags($(this).html(), '<a>');
						if (text) {
							// ...
							text_lines = text.split('\n');
							// multiple lines
							if (text_lines) {
								item.body = '';
								for (var line in text_lines) {
									// ...
									t = uu.trim(text_lines[line]);
									t_len = t.length;
									// title
									if (t_len > 33) {
										if (item.body === '' && t_len < 200) {
											item.body += "<p>" + t + "</p>\n";
										} else {
											item.body += "<p>" + t + "</p>\n";
										}
									}
								}
								// one line
							} else {
								// ...
								t = trim(text);
								t_len = t.length;
								// title
								if (t_len > 33) {
									item.body = "<p>" + t + "</p>\n";
								}
							}
						}

						///////////////////////////////////////////////////////////////////
						// ITEMS
						//if (item.img.src || item.url || item.body)) {
						// filter
						if (item.body) {
							item.url = uu.parseUrl(item.body);
						}
						// save
						items.push(item);
						//}


					});
					return items;

				}, this.site);

			});

			///////////////////////////////////////////////////////////////
			// DONE
			//

			if (this.site.items) {
				var post = {};
				post.site = this.site;

				//FS.write( APP.path + '/1/public/' + SITE.domain + SITE.path + '.json', this.site.items, 'w');
				// var file = CASPER.hash(this.site.meta.url,0);
				// FS.write( APP.path +'/out/'+ file +'.json', this.site.items, 'w');

				// SAVE
				CASPER.thenOpen('http://localhost:8000/site', {
					method: 'post',
					data: JSON.stringify(post, null, '\t'),
					headers: {
						'Content-type': 'application/json'
					}
				});
				CASPER.then(function(data) {
					this.echo('POSTED!', data, this.getPageContent());
				});

				//SITES[this.site.meta.id] = this.site;
			}

		});

		//FS.write('sites.json', JSON.stringify( SITES, null, " "), 'w');

	});



	// ALL DONE
	CASPER.on('run.complete', function() {
		this.echo('Test completed');
		this.exit();
	});



	////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////////////
	//
	// REMOTE
	CASPER.on('remote.message', function(msg) {
		msg = JSON.parse(msg);
		if (msg && msg.status && msg.data) {
			this.log(JSON.stringify(msg.data, null, " "));
		}
	});
	CASPER.on("page.error", function(pageErr) {
		this.log('REMOTE ERROR :: ' + JSON.stringify(pageErr, null, " "), 'error');
	});
	CASPER.on('http.status.404', function(resource) {
		this.log('404 error: ' + resource.url, 'error');
	});
	CASPER.on('http.status.500', function(resource) {
		this.log('500 error: ' + resource.url, 'error');
	});
	//
	// HELPERS
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
	//


	// // SAVE
	// CASPER.open('http://localhost:8000/sites', {
	//     method: 'post',
	//     data:   {
	//         'title': 'Plop',
	//         'body':  'Wow.'
	//     },
	//     headers: {
	//         'Content-type': 'multipart/form-data'
	//     }
	// });
	// CASPER.then(function(data) {
	// 		this.echo('ALL SITES');
	// 		SITES = this.getPageContent();
	// 		this.echo(SITES);
	// });


});
CASPER.run();
