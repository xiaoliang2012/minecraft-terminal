const { clear: { clearLine }, color: { dim, reset, bold, rgb } } = require('./ansi');
let chatLine;
const setSWInterface = (swint) => {
	chatLine = swint;
};

const safeWrite = (msg, end) => {
	if (!msg) msg = '';
	let line;
	if (chatLine === undefined) line = '';
	else line = chatLine.line;
	clearLine(true);
	if (end === 1) process.stdout.write(`${msg}\n${line}`);
	else if (end === 0 || end === undefined) process.stdout.write(`${msg}\n>${line}`);
	else if (end === 2) process.stdout.write(msg + line);
	if (chatLine) {
		chatLine.pause();
		chatLine.resume();
	}
};

const rpstr = (str, spacenum) => {
	let spaces = '';
	let out;
	if (typeof str === 'string') {
		for (let i = 0; i < spacenum; i++) {
			spaces = spaces + ' ';
		}
		out = str.replace(/\n/g, '\n' + spaces);
	} else out = str;

	return out;
};

const info = (str, end) => {
	safeWrite(`${bold + dim}[INFO] ${rpstr(str, 7) + reset}`, end);
};

const warn = (str, end) => {
	safeWrite(`${bold + rgb(255, 255, 85)}[WARN] ${rpstr(str, 7) + reset}`, end);
};

const error = (str, end) => {
	safeWrite(`${bold + rgb(255, 85, 85)}[ERR] ${rpstr(str, 6) + reset}`, end);
};

const success = (str, end) => {
	safeWrite(`${bold + rgb(85, 255, 85)}[OK] ${rpstr(str, 5) + reset}`, end);
};

module.exports = {
	setSWInterface,
	safeWrite,
	info,
	warn,
	error,
	success
};
