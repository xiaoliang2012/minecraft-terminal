const clear = () => {
	process.stdout.write('\x1b[0K\r');
};

module.exports = clear;
