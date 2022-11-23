const axios = require('axios');
function getPackage (packageName) {
	return axios({
		method: 'get',
		url: 'https://registry.npmjs.org/' + packageName + '/latest',
		responseType: 'text',
		responseEncoding: 'binary',
		headers: {
			'Accept-Encoding': 'raw'
		}
	})
		.then((res) => JSON.parse(res.data));
}

module.exports = getPackage;
