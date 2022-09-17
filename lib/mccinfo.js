const { clear: { clearLine }, color: { reset, bold, rgb } } = require('./ansi');
let chatLine;
const setSWInterface = (swint) => {
	chatLine = swint;
};

const safeWrite = (msg, end) => {
	if (!msg) msg = '';
	if (end === undefined) end = 0;
	let line;
	if (chatLine === undefined || chatLine.closed === true) line = '';
	else line = chatLine?.line;
	clearLine(true);
	if (end === 0) process.stdout.write(`${msg}\n${line}`);
	else if (end === 1) process.stdout.write(msg + line);
	else if (end === 2) process.stdout.write(msg + '\n');
	else if (end === 3) process.stdout.write(msg);
	if (chatLine !== undefined && chatLine.closed !== true && end < 2) {
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

const info = (str, end) => {
	const color = bold + rgb(40, 40, 45);
	safeWrite(`${color}[INFO] ${rpstr(str, 7, color) + reset}`, end);
};

const warn = (str, end) => {
	const color = bold + rgb(255, 255, 85);
	safeWrite(`${color}[WARN] ${rpstr(str, 7, color) + reset}`, end);
};

const error = (str, end) => {
	const color = bold + rgb(255, 85, 85);
	safeWrite(`${color}[ERR] ${rpstr(str, 6, color) + reset}`, end);
};

const success = (str, end) => {
	const color = bold + rgb(85, 255, 85);
	safeWrite(`${color}[OK] ${rpstr(str, 5, color) + reset}`, end);
};

module.exports = {
	setSWInterface,
	safeWrite,
	info,
	warn,
	error,
	success
};
