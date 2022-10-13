const requireTOML = require('requireTOML');
const mainPath = require('mainpath')();
const { join } = require('path');

let dir;
if (process.platform === 'win32') dir = join(mainPath, 'config');
else dir = join(require('os').homedir(), '.config', 'mc-term');

const cache = join(dir, 'configPath.toml');

function get () {
	return requireTOML(cache);
}

function path () {
	return cache;
}

module.exports = get;
module.exports.path = path;
