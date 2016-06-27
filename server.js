'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server();

server.connection({
	host: '127.0.0.1',
	port: 3000
});

server.route({
	method: 'GET',
	path: '/',
	handler: function(request, reply) {
		return reply('Hello world!');
	}
});

server.route({
	method: 'GET',
	path: '/{name}',
	handler: function(request, reply) {
		reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
	}
});

server.start((err) => {
	if (err) {
		throw err;
	}
	console.log('Server running at port 3000');
});