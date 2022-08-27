const parse = (str) => {
	if (!isNaN(str)) return Number(str);
	switch (str) {
	case 'false': return false;
	case 'true': return true;
	case 'null': return null;
	case 'undefined': return undefined;
	default: return str;
	}
};

const parseStr = (str) => {
	if (typeof str === 'object') {
		const out = [];
		for (let i = 0; i < str.length; i++) {
			out[i] = parse(str[i]);
		}
		return out;
	} else if (typeof str === 'string') {
		return parse(str);
	} else return str;
};

module.exports = parseStr;
