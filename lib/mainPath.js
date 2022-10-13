const { resolve, join } = require('path');

function mainPath () {
	return resolve(join(__dirname, '..'));
}

module.exports = mainPath;
