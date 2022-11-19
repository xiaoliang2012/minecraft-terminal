const sleep = require('./sleep');

let borANSIColor = '\x1b[38;2;85;255;255m';
let perANSIColor = '\x1b[38;2;255;85;85m';
let prefix = '';
let suffix = '';

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
const progress = (percent, size) => {
	if (percent <= 100) {
		let a = borANSIColor + '<' + perANSIColor;
		const b = Math.floor(size * percent / 100);
		const sp = size - b;
		for (let i = 0; i < b; i++) {
			a = a + '━';
		}
		for (let i = 0; i < sp; i++) {
			a = a + ' ';
		}
		process.stdout.write((prefix || '') + a + borANSIColor + '>\x1b[0m' + (suffix || ''));
	} else throw new Error('Value cannot be greater than 100%');
};

const set = (borderColor, progressColor, suff, pref) => {
	if (borderColor) borANSIColor = borderColor;
	if (progressColor) perANSIColor = progressColor;
	if (pref) prefix = pref;
	if (suff) suffix = suff;
};

let started = false;

let startPer = 0;
let s = 0;
const start = (time, increment, endPercent, startPercent, size, callback = () => {}) => {
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
	s = size;
	started = true;
	const loopTime = (time * increment) / (endPercent - startPer);
	startPer = startPercent;

	(
		async () => {
		// eslint-disable-next-line no-unmodified-loop-condition
			while (startPer < endPercent && started === true) {
				progress(startPer, size);
				if (loopTime > 0) await sleep(loopTime);
				startPer = startPer + increment;
			}
			if (started === true) progress(startPer, size);
			callback();
			startPer = startPercent;
		}
	)();
};

const stop = () => {
	if (started === true) {
		started = false;
		progress(startPer, s);
	}
};

const update = (percent) => {
	if (percent < startPer || percent < 0) {
		return;
	}
	startPer = percent;
};

module.exports = { set, start, stop, update, progress };
