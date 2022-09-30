const parseVar = (str, obj, start, end) => {
	if (typeof str !== 'string' || typeof obj !== 'object') return str;
	if (end === '' || end === undefined) end = ' ';
	let amogus = '';
	if (end === ' ') amogus = ' ';
	const keys = Object.keys(obj);
	const values = Object.values(obj);
	let out = str;
	for (let i = 0; i < keys.length; i++) {
		out = out.replace(start + keys[i] + end, values[i] + amogus);
	}
	out = out.replace(new RegExp(`\\${start}.+\\${end}`), 'undefined' + amogus);
	return out;
};

module.exports = parseVar;
