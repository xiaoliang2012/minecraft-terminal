const escapeRegex = require('./escapeRegex');

function parse (str) {
	let strCopy = str.valueOf();

	const compare = (ops, andOr = '&') => {
		for (let i = 0; i < ops?.length; i++) {
			const op = ops[i];
			const bef = op.match(/^[^&|]+/)?.[0];
			const af = op.match(/(?<=[&|]).+/)?.[0];

			if (bef === af) {
				if (bef === 'true') {
					strCopy = strCopy.replace(op, true);
					continue;
				}
				if (bef === 'false') {
					strCopy = strCopy.replace(op, false);
					continue;
				}
			}

			if (bef === 'true' || af === 'true') {
				if (andOr === '|') {
					strCopy = strCopy.replace(op, true);
					continue;
				}
				if (andOr === '&') {
					strCopy = strCopy.replace(op, false);
					continue;
				}
			}

			strCopy = strCopy.replace(op, false);
		}
	};

	// Keep parsing until it stops changing
	{
		let oldStr;
		while (oldStr !== strCopy) {
			oldStr = strCopy.valueOf();

			// Parse &
			const andOps = strCopy.match(/[^()&|]+&[^()&|]+/g);
			compare(andOps, '&');

			// Parse |
			const orOps = strCopy.match(/[^()&|]+\|[^()&|]+/g);
			compare(orOps, '|');

			// Remove ()
			{
				const pars = strCopy.match(/(?<=\()[^()&|]+(?=\))/g);
				for (let i = 0; i < pars?.length; i++) {
					const par = pars[i];
					strCopy = strCopy.replace(`(${par})`, par);
				}
			}
		}
	}

	if (strCopy === 'false') {
		return false;
	}
	if (strCopy === 'true') {
		return true;
	}

	throw new Error('Invalid input');
}

function main (str = '', values, safe = true, assumeVal = false) {
	if (str === '' || typeof str !== 'string') {
		return;
	}

	// Remove whitespaces
	str = str.replace(/\s+/g, '');

	// Replace variables with their value
	if (values) {
		for (let i = 0, valKeys = Object.keys(values); i < valKeys?.length; i++) {
			const valKey = valKeys[i];
			str = str.replace(new RegExp(`((?<=[&|])|^)${escapeRegex(valKey)}`), values[valKey]);
		}
	}

	// Make everything lower case
	str = str.toLowerCase();

	const allVals = str.match(/[^()&|]+/g);
	if (safe === true) {
		// Throw an error if some variables were not set to booleans
		for (let i = 0; i < allVals?.length; i++) {
			if (!['true', 'false'].includes(allVals[i])) {
				throw new Error('Value must be of type Boolean');
			}
		}
	}
	if (safe !== true) {
		// Replace all unknown vars with ${assumeVal}
		for (let i = 0; i < allVals?.length; i++) {
			const val = allVals[i];
			if (!['true', 'false'].includes(val)) {
				str = str.replace(val, assumeVal);
			}
		}
	}

	// Parse
	str = parse(str);
	return str;
}

module.exports = main;
