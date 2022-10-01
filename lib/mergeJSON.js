const edit = require('./editfile');
const absolutePath = require('./absolutePath');
const merge = require('merge');

const a = (file, obj) => {
	edit.editJSON(absolutePath(file), absolutePath(file), (data) => {
		merge.recursive(obj, data);
		return obj;
	});
};

module.exports = a;
