const editFile = (input, output, callback) => {
	const fs = require('fs');
	const data = fs.readFileSync(input, 'utf-8');
	fs.writeFileSync(output, callback(data), 'utf-8');
}

const editJSON = (input, output, callback) => {
	const fs = require('fs');
	const data = require(input);
	fs.writeFileSync(output, JSON.stringify(callback(data), null, '\t'), 'utf-8');
}

module.exports = {
	editFile,
	editJSON
}
