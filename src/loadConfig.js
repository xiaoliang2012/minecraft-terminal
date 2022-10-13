const { error, warn, info, highLight1 } = require('logger');
const requireTOML = require('requireTOML');
const { join } = require('path');
const configPath = require('configpath')().path;

const readErrMSG = (file) => {
	return `An error occurred while trying to read "${highLight1(file)}"`;
};

function load (settings) {
	const config = {};
	if (settings.config.enabled.plugins === true) {
		try {
			config.plugins = requireTOML(join(configPath, 'plugins.toml'));
		} catch {
			error(readErrMSG('plugins.toml'));
		}
	} else {
		warn('Not using plugins');
	}

	if (settings.config.enabled.config === true) {
		try {
			config.config = requireTOML(join(configPath, 'config.toml'));
		} catch {
			error(readErrMSG('config.toml'));
		}
	} else {
		warn('Using default config');
	}

	let physics;
	try {
		physics = requireTOML(`${configPath}/physics.toml`);
		if (physics.usePhysicsJSON === true) {
			warn(`Using custom physics. this will result in a ${highLight1('ban')}%COLOR% in most servers!`);
			info('You can disable it by editing usePhysicsJSON in physics.toml');
			config.physics = physics;
		}
	} catch {
		error(readErrMSG('physics.toml'));
	}

	if (settings.config.enabled.cred === true) {
		try {
			config.cred = {
				...{
					auth: undefined,
					username: undefined,
					password: undefined,
					server: undefined,
					version: undefined
				},
				...requireTOML(join(configPath, 'credentials.toml'))
			};
		} catch (e) {
			error(readErrMSG('credentials.toml'));
		}
	}

	return config;
}

module.exports = load;
