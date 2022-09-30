const escapeRegex = require('./escapeRegex');

const parseVar = (str, obj, start, end) => {
	if (typeof str !== 'string' || typeof obj !== 'object') return str;
	if (end === '' || end === undefined) end = ' ';
	let amogus = '';
	if (end === ' ') amogus = ' ';
	const keys = Object.keys(obj);
	const values = Object.values(obj);
	start = escapeRegex(start);
	end = escapeRegex(end);
	let out = str;
	for (let i = 0; i < keys.length; i++) {
		out = out.replace(new RegExp(start + escapeRegex(keys[i]) + end, 'g'), values[i] + amogus);
	}
	out = out.replace(new RegExp(`${start}[^${end}]+${end}`, 'g'), 'undefined' + amogus);
	return out;
};

module.exports = parseVar;
