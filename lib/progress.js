const sleep = require('sleep');

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
 * progress(0, 15, '\rLoading: ');
 * const lib1 = require('largeLib1');
 * progress(50, 15, '\rLoading: ');
 * const lib2 = require('largeLib2');
 * progress(100, 15, '\rLoading: ');
 *
 */
const progress = (percent, size, prefix, suffix, borANSIColor, perANSIColor) => {
	if (!borANSIColor) borANSIColor = '\x1b[38;2;85;255;255m';
	if (!perANSIColor) perANSIColor = '\x1b[38;2;255;85;85m';
	if (percent <= 100) {
		let a = borANSIColor + '<' + perANSIColor;
		const b = Math.floor(size * percent / 100);
		for (let i = 0; i < b; i++) {
			a = a + '━';
		}
		for (let i = 0; i < size - b; i++) {
			a = a + ' ';
		}
		process.stdout.write((prefix || '') + a + borANSIColor + '>\x1b[0m' + (suffix || ''));
	} else throw new Error('Value cannot be greater than 100%');
};

let stuff = [];

let started = false;

let startPer = 0;
const start = async (time, increment, endPercent, startPercent, size, prefix, suffix, borANSIColor, perANSIColor) => {
	if (endPercent > 100) {
		throw new Error('Value cannot be greater than 100%');
	}
	if (!Number.isInteger(increment)) {
		throw new Error('Increment must be an Integer');
	}
	if (increment <= 0) {
		throw new Error('Increment must be more than 0');
	}
	if (increment > (endPercent - startPer)) {
		throw new Error('Increment is too high');
	}
	if (started === true) {
		return;
	}
	started = true;
	stuff = [
		endPercent,
		size,
		prefix,
		suffix,
		borANSIColor,
		perANSIColor
	];
	const loopTime = (time * increment) / (endPercent - startPer);
	startPer = startPercent;
	// eslint-disable-next-line no-unmodified-loop-condition
	while (startPer < endPercent && started === true) {
		progress(startPer, size, prefix, suffix, borANSIColor, perANSIColor);
		await sleep(loopTime);
		startPer = startPer + increment;
	}
	if (started === true) progress(startPer, size, prefix, suffix, borANSIColor, perANSIColor);
	startPer = startPercent;
};

const stop = () => {
	if (started === true) {
		started = false;
		progress(...stuff);
	}
	process.stdout.write('\n');
};

const update = (percent) => {
	if (percent < startPer || percent < 0) {
		return;
	}
	startPer = percent;
};

module.exports = { start, stop, update, progress };
