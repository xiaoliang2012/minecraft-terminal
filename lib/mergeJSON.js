const edit = require('./editfile');
const absolutePath = require('./absolutePath');
const { isPlainObject, recursive } = require('merge');

module.exports = (file, obj) => {
	const absPathToFile = absolutePath(file);
	edit.editJSON(absPathToFile, absPathToFile, (data) => {
		if (isPlainObject(data)) {
			recursive(obj, data);
		} else {
			obj = [...obj, ...data];
		}
		return obj;
	});
};
