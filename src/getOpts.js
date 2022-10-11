const PACKAGE = require('PACKAGE');
const getopt = require('getopts');

getopt(['--help', '-h'], 0, () => {
	process.stdout.write(
		'Usage:' +
		'   --no-conf, -nc           Do not use the configuration file.\n' +
		'   --no-cred, -ns           Do not use the credentials file.\n' +
		'   --no-plugins, -np        Do not load plugins specified in plugins file.\n' +
		'   --set-conf-path, -scp    Set the config folder path\n' +
		'   --get-conf-path, -gcp    Get the config folder path\n' +
		'   --cred, -c               <Auth> <Username> <Password> <Version> <Server>\n' +
		'                            Override credentials from CLI arguments.\n' +
		'   --debug                  Enable debug mode.\n' +
		'   --version, -v            Show version information.\n' +
		'   --help, -h               Show this help message.\n'
	);
	process.exit();
});

getopt(['--version', '-v'], 0, () => {
	process.stdout.write(`${PACKAGE.name} version: ${PACKAGE.version}\nNode version: ${process.version}\n`);
	process.exit();
});

getopt(['--set-conf-path', '-scp'], 2, (params) => {
	const { editJSON } = require('./lib/editfile');
	const requireTOML = require('requireTOML');

	const configPathPath = requireTOML('');

	let dir = params[1] || '';
	if (!dir.match(/^[/~]/m)) {
		dir = resolve(dir).replace(/\\/g, '/');
	}
	editJSON(configPathPath, configPathPath, (data) => {
		data.configpath = dir;
		return data;
	});
	process.exit();
});

getopt(['--get-conf-path', '-gcp'], 0, () => {
	process.stdout.write(`Path to config: '${configpath}'\n`);
	process.exit();
});