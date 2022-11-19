const { isPlainObject } = require('merge');

function onlyKeepKeys (obj = {}, obj2 = {}) {
	const outObj = Object.assign({}, obj);
	const objKeys = Object.keys(outObj);
	const obj2Keys = Object.keys(obj2);
	for (let i = 0; i < objKeys.length; i++) {
		const objKey = objKeys[i];
		const a = isPlainObject(outObj[objKey]) && isPlainObject(obj2[objKey]);

		if (obj2Keys.includes(objKey) && !a) {
			continue;
		}
		if (a) {
			outObj[objKey] = onlyKeepKeys(outObj[objKey], obj2[objKey]);
			continue;
		}
		delete outObj[objKey];
	}
	return outObj;
}

module.exports = onlyKeepKeys;
