'use strict';

const Hapi = require('hapi');
const Good = require('good');

const Server = new Hapi.Server();

Server.connection({
	host: '127.0.0.1',
	port: 3000
});

Server.route({
	method: 'GET',
	path: '/',
	handler: function(request, reply) {
		return reply('Hello world!');
	}
});

Server.route({
	method: 'GET',
	path: '/{name}',
	handler: function(request, reply) {
		reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
	}
});

Server.register({
	register: Good,
	options: {
		reporters: {
			console: [{
				module: 'good-squeeze',
				name: 'Squeeze',
				args: [{
					response: '*',
					log: '*'
				}]				
			}, {
				module: 'good-console'
			}, 'stdout']
		}
	}
}, (err) => {
	if (err) {
		throw err;
	}

	Server.start((err) => {
		if (err) {
			throw err;
		}

		Server.log('info', 'Server running at: ' + Server.info.uri);
	});

});