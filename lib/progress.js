
/**
 * The progress function returns a string that contains the progress bar.
 *
 *
 * @param {number} percent The percentage of completion (0-100)
 * @param {number} size The size of the progress bar in characters, including brackets and spaces.
 * @param {string} borANSIColor An ANSI color code for coloring the border of the progress bar. Defaults to \x1b[38;2;85;255;255m (light blue).
 * @param {string} perANSIColor An ANSI color code for coloring the progress. Defaults to \x1b[38;2;255,85,85m (light red).
 * @return {string | void} A string that contains the progress bar.
 * @example
 * process.stdout.write('Loading: ' + progress(0, 15));
 * const largeLib1 = require('largeLib1');
 * process.stdout.write('\rLoading: ' + progress(50, 15));
 * const largeLib2 = require('largeLib2');
 * process.stdout.write('\rLoading: ' + progress(100, 15));
 *
 */
const progress = (percent, size, borANSIColor, perANSIColor) => {
	if (!borANSIColor) borANSIColor = '\x1b[38;2;85;255;255m';
	if (!perANSIColor) perANSIColor = '\x1b[38;2;255;85;85m';
	if (percent <= 100) {
		let a = borANSIColor + '<' + perANSIColor;
		const b = Math.floor(size * percent / 100);
		for (let i = 0; i < b; i++) {
			a = a + '━';
		};
		for (let i = 0; i < size - b; i++) {
			a = a + ' ';
		};
		return a + borANSIColor + '>\x1b[0m';
	} else console.error('Value cannot be greater than 100%');
};

module.exports = progress;
