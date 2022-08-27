const compare = (ver1, ver2) => {
	if (typeof ver1 === 'string' && typeof ver2 === 'string') {
		const splitVer1 = ver1.split('.');
		const splitVer2 = ver2.split('.');
		let length;
		if (splitVer1.length > splitVer2.length) length = splitVer1.length;
		else length = splitVer2.length;
		for (let i = 0; i < length; i++) {
			if ((Number(splitVer1[i]) || 0) > (Number(splitVer2[i]) || 0)) return true;
			else if ((Number(splitVer1[i]) || 0) < (Number(splitVer2[i]) || 0)) return false;
		}
	}
	return null;
};

module.exports = compare;
