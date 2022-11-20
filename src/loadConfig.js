const { error, warn, info, highLight1 } = require('../lib/log');
const requireTOML = require('../lib/requireTOML');
const { join } = require('path');
const configPath = require('../lib/configPath')().path;

const readErrMSG = (file, errorMsg) => {
	let out;
	if (errorMsg) {
		out = `An error occurred while trying to read "${file}".\n${errorMsg}`;
	} else {
		out = `An error occurred while trying to read "${file}"`;
	}
	return out;
};

function load (settings) {
	const config = {};
	if (settings.config.enabled.plugins === true) {
		try {
			config.plugins = requireTOML(join(configPath, 'plugins.toml'));
		} catch (e) {
			error(readErrMSG('plugins.toml', e.message));
		}
	} else {
		warn('Not using plugins');
	}

	if (settings.config.enabled.config === true) {
		try {
			config.config = requireTOML(join(configPath, 'config.toml'));
		} catch (e) {
			error(readErrMSG('config.toml', e.message));
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
			settings.config.enabled.physics = true;
			delete physics.usePhysicsJSON;
			config.physics = physics;
		}
	} catch (e) {
		error(readErrMSG('physics.toml', e.message));
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
			error(readErrMSG('credentials.toml', e.message));
		}
	}

	return config;
}

module.exports = load;
