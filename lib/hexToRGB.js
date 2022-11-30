
/**
 * Converts a hexadecimal color value to an RGB array.
 *
 * @param hex The color of the background.
 * @param length Lenght of the hex code.
 * @return An array of rgb values numbers.
 */
const hexToRGB = (hex = '#ffffff', length = [6]) => {
	let c;
	if (/^#[A-Fa-f\d]{3,8}$/.test(hex)) {
		c = hex.substring(1).split('');
		if (c.length === 3 && length.includes(3)) {
			c = [c[0], c[0], c[1], c[1], c[2], c[2]];
		} else if ((c.length === 6 || c.length === 8) && (length.includes(6) || length.includes(8))) {
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
