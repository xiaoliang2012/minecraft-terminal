const { clear: { clearLine }, color: { dim, reset, bold, rgb } } = require('./ansi');
let chat;
const setSWInterface = (swint) => {
	chat = swint;
};

const safeWrite = (msg, end) => {
	if (!msg) msg = '';
	clearLine(true);
	if (end === 1) process.stdout.write(`${msg}\n${chat.line}`);
	else if (end === 0 || end === undefined) process.stdout.write(`${msg}\n>${chat.line}`);
	else if (end === 2) process.stdout.write(msg + chat.line);
}

const info = (str, end) => {
	safeWrite(`${bold + dim}[INFO] ${str + reset}`, end);
};

const warn = (str, end) => {
	safeWrite(`${bold + rgb(255, 255, 85)}[WARN] ${str + reset}`, end);
};

const error = (str, end) => {
	safeWrite(`${bold + rgb(255, 85, 85)}[ERROR] ${str + reset}`, end);
};

module.exports = {
	setSWInterface,
	safeWrite,
	info,
	warn,
	error
};
