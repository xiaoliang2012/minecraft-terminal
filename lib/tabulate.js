const tab = (str1, str2, distance) => {
	if (str2 === undefined) return str1;
	let space = '';
	for (let i = 0; i < distance - str1.length; i++) {
		space = `${space} `;
	}
	if (str1 === undefined) return space + str2;
	return str1 + space + str2;
};

module.exports = tab;
