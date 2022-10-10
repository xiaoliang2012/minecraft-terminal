const hexToRGB = (hex = '#ffffff', length = 6) => {
	let c;
	if (/^#([A-Fa-f0-9]){3,8}$/.test(hex)) {
		c = hex.substring(1).split('');
		if (c.length === 3 && length === 3) {
			c = [c[0], c[0], c[1], c[1], c[2], c[2]];
		} else if ((c.length === 6 || c.length === 8) && (length === 6 || length === 8)) {
			c = [c[0], c[1], c[2], c[3], c[4], c[5]];
		} else {
			throw new Error('Bad Hex');
		}
		c = '0x' + c.join('');
		return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
	}
	throw new Error('Bad Hex');
};
module.exports = hexToRGB;
