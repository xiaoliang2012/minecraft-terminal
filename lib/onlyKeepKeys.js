function onlyKeepKeys (obj = {}, obj2 = {}) {
	const outObj = Object.assign({}, obj);
	const objKeys = Object.keys(outObj);
	const obj2Keys = Object.keys(obj2);
	for (let i = 0; i < objKeys.length; i++) {
		const objKey = objKeys[i];
		const a = typeof outObj[objKey] === 'object' && typeof obj2[objKey] === 'object';

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
