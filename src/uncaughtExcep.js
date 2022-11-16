const { error, warn } = require('../lib/log');
const PACKAGE = require('PACKAGE');

function set (debug) {
	let onUncaughtException;

	if (debug === false) {
		onUncaughtException = (err) => {
			if (typeof err !== 'object') {
				error(`An unexpected error occurred.\n${err}`);
				return;
			}
			const stack = err.stack?.split('\n');
			let relevant = '';
			if (stack[1]) relevant = `\n${stack[1]}`;
			if (stack[2]) relevant = `${relevant}\n${stack[2]}`;
			err.message = err.message.split('\n')[0];
			error(`An unexpected error occurred.\n${err.message}${relevant}`);
			warn(`Please open a bug report on github: ${PACKAGE.bugs.url}`);
			process.exit(1);
		};
	} else {
		onUncaughtException = (err) => {
			process.stdout.write(err.stack);
		};
	}
	process.on('uncaughtException', onUncaughtException);
}

module.exports = set;
