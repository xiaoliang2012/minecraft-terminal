const axios = require('axios');
function getPackage (packageName) {
	return axios
		.get('https://registry.npmjs.org/' + packageName + '/latest')
		.then(res => res.data);
}

module.exports = getPackage;
