const parseCoords = (str, position, fixed) => {
	const match = str.match(/[-~+\d]+ [-~+\d]+ ~[-~+\d]*/g);
	if (!match) {
		return str;
	};
	if (typeof position !== 'object') {
		position = { x: 0, y: 0, z: 0 };
	};
	let outCoords = '';

	let outCommand = str;
	for (let i = 0; i < match.length; i++) {
		if (!match[i].match('~')) {
			continue;
		}
		let outX, outY, outZ;

		const x = Number(match[i].match(/(?<=^~)[-+\d]+/m));
		if (fixed) outX = Number((position.x + (x || 0)).toFixed(fixed));
		else outX = position.x + (x || 0);
		outCoords = match[i].replace(/^~[-+\d]*/, outX);

		const y = Number(match[i].match(/(?<!^~)(?<=~)[-+\d]+(?= )(?!$)/));
		if (fixed) outY = Number((position.y + (y || 0)).toFixed(fixed));
		else outY = position.y + (y || 0);
		outCoords = outCoords.replace(/(?<!^)(?<= )~[-+\d]*/, outY);

		const z = Number(match[i].match(/[-+\d]+$/));
		if (fixed) outZ = Number((position.z + (z || 0)).toFixed(fixed));
		else outZ = position.z + (z || 0);
		outCoords = outCoords.replace(/~[-+\d]*$/m, outZ);

		outCommand = outCommand.replace(match[i], outCoords);
	}
	return outCommand;
};

module.exports = parseCoords;
