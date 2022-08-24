const axios = require('axios');
function getVer (packageName) {
	return axios
		.get('https://registry.npmjs.org/' + packageName + '/latest')
		.then(res => res.data.version);
}

module.exports = getVer;
