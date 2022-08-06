const { cursor, clear } = require('./ansi');
const sleep = require('./sleep');
/**
 * The printCentered function prints a string centered in the terminal.
 *
 * @param str Used to Print the string that is passed in.
 * @param row Used to Determine where to start the text.
 * @return A function that prints the given string centered on a line.
 *
 */
function printCentered (str, row) {
	cursor.DEC.saveCursorPos();
	if (isNaN(row)) row = 1;
	const termSize = cursor.termSize()[1];
	if (str.length % termSize !== 0 && str.length > termSize) {
		const text = [];
		text[0] = str.slice(0, str.length - (str.length % termSize));
		text[1] = str.slice(str.length - (str.length % termSize));
		cursor.cursorTo(row, 1);
		clear.clearLine();
		cursor.cursorMove(1);
		clear.clearLine();
		cursor.cursorMove(-1);
		process.stdout.write(text[0]);
		cursor.cursorTo((text[0].length / termSize) + row, Math.ceil((termSize - text[1].length) / 2) + 1);
		clear.clearLine();
		process.stdout.write(text[1]);
	} else {
		cursor.cursorTo(row, Math.ceil((termSize - str.length) / 2) + 1);
		clear.clearLine();
		process.stdout.write(str);
	}
	cursor.DEC.restoreCursorPos();
}

module.exports = printCentered;