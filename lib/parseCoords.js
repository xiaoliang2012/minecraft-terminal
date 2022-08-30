const parseCoords = (str, position) => {
	const match = str.match(/[~\d]+ [~\d]+ [~\d]+/g);
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
		outCoords = match[i].replace(/^~/m, position.x);
		outCoords = outCoords.replace(/~$/m, position.z);
		outCoords = outCoords.replace(/(?<=\d )~/, position.y);
		outCommand = outCommand.replace(match[i], outCoords);
	}
	return outCommand;
};

module.exports = parseCoords;
