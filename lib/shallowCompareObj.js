const { isPlainObject } = require('merge');

module.exports = (obj1 = {}, obj2 = {}) => {
	if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
		return false;
	}
	const plainObj = isPlainObject(obj1);
	if (plainObj !== isPlainObject(obj2)) {
		return false;
	}

	if (plainObj) {
		const obj1Keys = Object.keys(obj1);
		for (let i = 0; i < obj1Keys.length; i++) {
			const key = obj1Keys[i];
			const obj1Val = obj1[key];
			const obj2Val = obj2[key];
			if ((obj1Val !== obj2Val) && (!['object', 'function'].includes(typeof obj1Val) || !['object', 'function'].includes(typeof obj2Val))) {
				return false;
			}
		}
		return true;
	}
	for (let i = 0; i < obj1.length; i++) {
		const obj1Val = obj1[i];
		const obj2Val = obj2[i];
		if ((obj1Val !== obj2Val) && (!['object', 'function'].includes(typeof obj1Val) || !['object', 'function'].includes(typeof obj2Val))) {
			return false;
		}
	}
	return true;
};
