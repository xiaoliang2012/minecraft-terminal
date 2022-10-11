function requireTOML (path) {
	const { readFileSync, accessSync, constants } = require('fs');
	accessSync(path, constants.F_OK);
	const { parse } = require('@iarna/toml');
	return parse(readFileSync(path));
}

module.exports = requireTOML;
