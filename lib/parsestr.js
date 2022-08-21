function parseStr (str) {
	if (typeof str === 'object') {
		const out = [];
		for (let i = 0; i < str.length; i++) {
			if (typeof str[i] === 'string') {
				if (!isNaN(str[i])) out[i] = Number(str[i]);
				else if (str[i] === 'false') out[i] = false;
				else if (str[i] === 'true') out[i] = true;
				else if (str[i] === 'null') out[i] = null;
				else if (str[i] === 'undefined') out[i] = undefined;
				else out[i] = str[i];
			}
		}
		return out;
	} else if (typeof str === 'string') {
		let out;
		if (!isNaN(str)) out = Number(str);
		else if (str === 'false') out = false;
		else if (str === 'true') out = true;
		else if (str === 'null') out = null;
		else if (str === 'undefined') out = undefined;
		else out = str;
		return out;
	} else return str;
};

module.exports = parseStr;
