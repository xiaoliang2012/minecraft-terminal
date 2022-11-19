const { clear: { clearLine }, color: { reset, bold, rgb, underline } } = require('./ansi');
// require('../lib/ansi').color.BG
let chatLine;
const setSWInterface = (swint) => {
	chatLine = swint;
};

const safeWrite = (msg = '', end = 0) => {
	let line;
	if (chatLine === undefined || chatLine.closed === true) line = '';
	else line = chatLine?.line;
	clearLine(true);
	if (end === 0) process.stdout.write(`${msg}\n${line}`);
	else if (end === 1) process.stdout.write(msg + line);
	else if (end === 2) process.stdout.write(msg + '\n');
	else if (end === 3) process.stdout.write(msg);
	if ((end === 0 || end === 1) && (chatLine !== undefined && chatLine.closed !== true && end < 2)) {
		chatLine.prompt(true);
	}
};

const rpstr = (str, spacenum, prefix) => {
	let spaces = '';
	let out;
	if (typeof str === 'string') {
		if (prefix === undefined) prefix = '';
		for (let i = 0; i < spacenum; i++) {
			spaces = spaces + ' ';
		}
		out = str.replace(/\n/g, '\n' + prefix + spaces);
	} else out = str;

	return out;
};

const info = (str = '', end) => {
	str = str.replace(/%COLOR%/g, info.color);
	safeWrite(`${info.color}[INFO] ${rpstr(str, 7, info.color) + reset}`, end);
};
info.color = reset + bold + rgb(130, 130, 200);

const warn = (str, end) => {
	str = str.replace(/%COLOR%/g, warn.color);
	safeWrite(`${warn.color}[WARN] ${rpstr(str, 7, warn.color) + reset}`, end);
};
warn.color = reset + bold + rgb(255, 255, 85);

const error = (str, end) => {
	str = str.replace(/%COLOR%/g, error.color);
	safeWrite(`${error.color}[ERR] ${rpstr(str, 6, error.color) + reset}`, end);
};
error.color = reset + bold + rgb(255, 85, 85);

const success = (str, end) => {
	str = str.replace(/%COLOR%/g, success.color);
	safeWrite(`${success.color}[OK] ${rpstr(str, 5, success.color) + reset}`, end);
};
success.color = reset + bold + rgb(85, 255, 85);

const highLight1 = (str) => {
	return highLight1.color + str + reset;
};
highLight1.color = bold + underline + rgb(255, 85, 85);

module.exports = {
	setSWInterface,
	safeWrite,
	highLight1,
	info,
	warn,
	error,
	success
};
