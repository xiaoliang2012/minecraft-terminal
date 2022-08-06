/* eslint-disable no-tabs */

/**
 * The getopt function is a helper function that parses command line arguments.
 * It takes three parameters: opt, numpar and callback. The opt parameter is an array of strings representing the options to be parsed.
 * The numpar parameter is an integer representing the number of parameters expected for each option in the opt array.
 * The callback parameter is a function that will receive all values associated with each option in the same order as they appear in opt.
 *
 * @param {array} opt Used to Store the options that are passed to the program.
 * @param {Int} numpar Used to Specify the number of parameters that are expected after the option.
 * @param {function} callback Used to Pass the parameters to the function that is called after a match has been found.
 * @return The array of arguments that follow the specified option.
 * @example
 * getopt(['--version', '-v'], 0, () => {
 * 	console.log('Version: ' + require('./package.json').version));
 * 	process.exit();
 * };
 */

function getopt (opt, numpar, callback) {
	const args = process.argv.slice(2);
	if (typeof opt === 'object') {
		for (let i = 0; i < args.length; i++) {
			for (let a = 0; a < opt.length; a++) {
				if (opt[a] === args[i]) {
					callback(args.slice(i, numpar));
					return;
				}
			}
		}
	}
};

module.exports = getopt;
