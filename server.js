'use strict';

const Hapi   = require('hapi');
const Good   = require('good');
const Bcrypt = require('bcrypt');
const Basic  = require('hapi-auth-basic');
const Cookie = require('hapi-auth-cookie');

let uuid = 1;

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

/** Login handler **/

const login = function(request, reply) {
	if (request.auth.isAuthenticated) {
		return reply.redirect('/');
	}

	let account = null;

	if (request.method === 'get') {
		return reply('<html><head><title>Login page</title></head><body><h3>Login</h3>' +
            '<form method="post" action="/login">' +
            'Username: <input type="text" name="username"><br>' +
            'Password: <input type="password" name="password"><br/>' +
            '<input type="submit" value="Login"></form></body></html>');
	}

	if (request.method === 'post') {
		account = findUserByUsername(request.payload.username);
	}

	const sid = String(++uuid);

	request.server.app.cache.set(sid, {account: account}, 0, (err) => {
		if (err) {
			reply(err);
		}

		request.cookieAuth.set({sid: sid});
		return reply.redirect('/');
	});
};

const home = function(request, reply) {
	reply('<html><head><title>Login page</title></head><body><h3>Welcome ' +
      request.auth.credentials.name +
      '!</h3><br/><form method="get" action="/logout">' +
      '<input type="submit" value="Logout">' +
      '</form></body></html>');
};

Server.connection({
	host: '127.0.0.1',
	port: 3000
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
}, Basic, Cookie], (err) => {
	if (err) {
		throw err;
	}

	const cache = Server.cache({
		segment: 'sessions',
		expiresIn: 3 * 24 * 60 * 60 * 1000
	});

	Server.app.cache = cache;

	Server.auth.strategy('simple', 'basic', {validateFunc: validate});

	Server.auth.strategy('session', 'cookie', true, {
		password: 'password-should-be-32-characters',
		cookie: 'sid-example',
		redirectTo: '/login',
		isSecure: true,
		validateFunc: function(request, session, cb) {
			cache.get(session.sid, (err, cached) => {
				if (err) {
					return cb(err, false);
				}

				if (!cached) {
					return cb(null, false);
				}

				return cb(null, true, cached.account);
			});
		}
	});

	Server.route([
		{
			method: 'GET',
			path: '/auth',
			config: {
				auth: 'simple',
				handler: function(request, reply) {
					reply('hello, ' + request.auth.credentials.name);
				}
			}
		}, {
			method: ['GET', 'POST'],
			path: '/login',
			config: {
				handler: login,
				auth: {
					mode: 'try'
				},
				plugins: {
					'hapi-auth-cookie': {
						redirectTo: false
					}
				}
			},
		},
		{
			method: 'GET',
			path: '/',
			config: {
				handler: home
			}
		}
	]);

	Server.start((err) => {
		if (err) {
			throw err;
		}

		Server.log('info', 'Server running at: ' + Server.info.uri);
	});

});