const editFile = (input, output, callback) => {
	const { writeFileSync, readFileSync } = require('fs');
	const data = readFileSync(input, 'utf-8');
	writeFileSync(output, callback(data), 'utf-8');
};

const editJSON = (input, output, callback) => {
	const { writeFileSync } = require('fs');
	const data = require(input);
	writeFileSync(output, JSON.stringify(callback(data), null, '\t'), 'utf-8');
};

module.exports = {
	editFile,
	editJSON
};
