'use strict';

const Hapi   = require('hapi');
const Good   = require('good');
const Bcrypt = require('bcrypt');
const Basic  = require('hapi-auth-basic');

const Server = new Hapi.Server();

/** Local db **/ 
const users = [{
	username: 'John',
	password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm', // 'secret'
	name: 'John Doe',
	id: '1'	
}];

var findUserByUsername = function(username) {
	return users.find(function(elem) {
		return elem.username === username;
	});
};

/** Validation function **/

const validate = function(request, username, password, cb) {
	const user = findUserByUsername(username);

	if (!user) {
		return cb(null, false);
	}

	Bcrypt.compare(password, user.password, (err, isValid) => {
		console.log(isValid);
		cb(err, isValid, {
			id: user.id,
			name: user.name
		});
	});
};

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
	},
	config: {
		description: 'Say hello to {name}',
		tags: ['api', 'greeting']
	}
});

Server.register([{
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
}, Basic], (err) => {
	if (err) {
		throw err;
	}

	Server.auth.strategy('simple', 'basic', {validateFunc: validate});

	Server.route({
		method: 'GET',
		path: '/auth',
		config: {
			auth: 'simple',
			handler: function(request, reply) {
				reply('hello, ' + request.auth.credentials.name);
			}
		}
	});

	Server.start((err) => {
		if (err) {
			throw err;
		}

		Server.log('info', 'Server running at: ' + Server.info.uri);
	});

});