const requireTOML = require('requireTOML');
const mainPath = require('mainpath');
const { join } = require('path');

function get () {
	return requireTOML(join(mainPath(), 'configPath.toml'));
}

module.exports = get;
