const { editObj } = require('./editfile');
const { isPlainObject, recursive } = require('merge');

module.exports = (obj, objOut) => {
	return editObj(obj, (data) => {
		if (isPlainObject(data)) {
			recursive(objOut, data);
		} else {
			objOut = [...objOut, ...data];
		}
		return objOut;
	});
};
