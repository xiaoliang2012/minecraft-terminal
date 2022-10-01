const absolutePath = (path) => {
	const { relative, join } = require('path');
	if (typeof path !== 'string') path = '.';
	return join('/', relative('/', path));
};

module.exports = absolutePath;
