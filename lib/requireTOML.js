
/**
 * Load and parse a TOML file.
 *
 * @param path The path to the config file.
 * @return A parsed toml file.
 */
function requireTOML (path) {
	const { readFileSync, accessSync, constants } = require('fs');
	accessSync(path, constants.F_OK);
	const { parse } = require('@iarna/toml');
	return parse(readFileSync(path));
}

module.exports = requireTOML;
