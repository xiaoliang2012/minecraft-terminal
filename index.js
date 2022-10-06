#!/usr/bin/env node

const { error, warn } = require('./lib/log');
const pkg = require('./package.json');

const getopt = require('./lib/getopts');

let DEBUG = false;
getopt(['--debug'], 0, () => {
	DEBUG = true;
});

let onUncaughtException;

if (DEBUG === false) {
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
		warn(`Please open a bug report on github: ${pkg.bugs.url}`);
		process.exit(1);
	};
} else {
	onUncaughtException = (err) => {
		process.stdout.write(err.stack);
	};
}

process.on('uncaughtException', onUncaughtException);

// Get help
getopt(['--help', '-h'], 0, () => {
	process.stdout.write(`Usage:
   --no-conf, -nc           Do not use the configuration file.
   --no-cred, -ns           Do not use the credentials file.
   --no-plugins, -np        Do not load plugins specified in plugins file.
   --set-conf-path, -scp    Set the config folder path
   --get-conf-path, -gcp    Get the config folder path
   --cred, -c               <Auth> <Username> <Password> <Version> <Server>
                            Override credentials from CLI arguments.
   --debug                  Enable debug mode
   --version, -v            Show version information.
   --help, -h               Show this help message.\n`);
	process.exit();
});

// Get version
getopt(['--version', '-v'], 0, () => {
	process.stdout.write(`${pkg.name} version: ${pkg.version}\nNode version: ${process.version}\n`);
	process.exit();
});

const { join, resolve } = require('path');

// Setup .configpath and default config path
let dir;
if (process.platform === 'win32') dir = join(__dirname, 'config');
else dir = join(require('os').homedir(), '.config', 'mc-term');
const configPathPath = join(dir, '.configpath.json');
try {
	require.resolve(configPathPath);
} catch (error) {
	const { writeFileSync } = require('fs');
	if (!require('fs').existsSync(dir)) {
		const { mkdirSync } = require('fs');
		mkdirSync(dir, { recursive: true });
	}
	const defaultPath = dir;
	writeFileSync(configPathPath, JSON.stringify({ configpath: defaultPath }), (err) => {
		if (err) error(err);
	});
}

const configpath = require(configPathPath).configpath;

getopt(['--set-conf-path', '-scp'], 2, (params) => {
	const { editJSON } = require('./lib/editfile');
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

const readline = require('readline');
const chat = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const { safeWrite, setSWInterface, info, success } = require('./lib/log');

/**
 * 0.auth
 * 1.username
 * 2.password
 * 3.server
 * 4.version
 * 5.port
 * 6.nocred
 * 7.noconf
 * 8.accept
*/
let cred = [];

// Do not use the ./config/credentials.toml file for credentials
let bcofnc;
getopt(['--no-cred', '-nc'], 1, (params) => {
	cred[6] = true;
	bcofnc = params[0];
});

// Do not use the ./config/config.toml file for configuration
let bcofns;
getopt(['--no-conf', '-ns'], 1, (params) => {
	cred[7] = true;
	bcofns = params[0];
});

// Do not use the ./config/plugin.toml file for configuration
let bcofnp;
getopt(['--no-plugins', '-np'], 1, (params) => {
	cred[8] = true;
	bcofnp = params[0];
});

const progress = require('./lib/progress');
progress(0, 15, 'Loading: ');

require('events').EventEmitter.defaultMaxListeners = 0;

// Generate and update config
const betterMerge = require('./lib/mergeObj');
const { readdirSync } = require('fs');
const TOML = require('@iarna/toml');

readdirSync(join(__dirname, 'default_config')).forEach(file => {
	const { writeFileSync, readFileSync } = require('fs');
	const filePath = join(configpath, file);
	const defaultConfigPath = join(__dirname, 'default_config', file);
	try {
		require.resolve(filePath);
	} catch (err) {
		const { cpSync } = require('fs');
		cpSync(defaultConfigPath, filePath);
		return;
	}
	const config = readFileSync(filePath);
	const defaultConfig = readFileSync(defaultConfigPath);
	const out = betterMerge(TOML.parse(config), TOML.parse(defaultConfig));
	const TOMLString = TOML.stringify(out).replace('  ', '\t');
	writeFileSync(filePath, TOMLString, 'utf-8');
});

if (cred[6] !== true) {
	const { accessSync, constants } = require('fs');
	try {
		accessSync(join(configpath, 'credentials.toml'), constants.F_OK);
		cred = Object.values(Object.assign({
			auth: undefined,
			username: undefined,
			password: undefined,
			server: undefined,
			version: undefined
		}, requireTOML(`${configpath}/credentials.toml`)));
	} catch (e) {
		process.stdout.write('\r');
		error('File "credentials.toml" not found');
		progress(0, 15, 'Loading: ');
	}
} else {
	process.stdout.write('\r');
	error(`Not using "credentials.toml" because of '${bcofnc}'`);
	progress(0, 15, 'Loading: ');
}

// Get credentials from CLI arguments
getopt(['--cred', '-c'], 6, (params) => {
	for (let i = 1; i < params.length; i++) {
		if (params[i] !== '!' && params[i] !== undefined) {
			cred[i - 1] = params[i];
		} else if (cred[i - 1] === '' || cred[i - 1] === undefined) cred[i - 1] = null;
	}
});

let YESPLUG = false;
if (cred[8] !== true) {
	const { accessSync, constants } = require('fs');
	try {
		accessSync(join(configpath, 'plugins.toml'), constants.F_OK);
		YESPLUG = true;
	} catch {
		process.stdout.write('\r');
		error('File "plugins.toml" not found');
		progress(0, 15, 'Loading: ');
	}
} else {
	process.stdout.write('\r');
	warn(`Not using plugins because of '${bcofnp}'`);
	progress(0, 15, 'Loading: ');
}

let YESCONF = false;
if (cred[7] !== true) {
	const { accessSync, constants } = require('fs');
	try {
		accessSync(join(configpath, 'config.toml'), constants.F_OK);
		YESCONF = true;
	} catch {
		process.stdout.write('\r');
		error('File "config.toml" not found');
		progress(0, 15, 'Loading: ');
	}
} else {
	process.stdout.write('\r');
	error(`Not using "config.toml" because of '${bcofns}'`);
	progress(0, 15, 'Loading: ');
}

let YESPS;
let physics;
try {
	physics = requireTOML(`${configpath}/physics.toml`);
	if (physics.usePhysicsJSON === true) {
		process.stdout.write('\r');
		warn('Using custom physics. this will result in a ban in most servers!');
		info('You can disable it by editing usePhysicsJSON in physics.toml');
		progress(0, 15, 'Loading: ');
		YESPS = true;
	}
} catch {
	process.stdout.write('\r');
	error('File "physics.toml" not found');
	progress(0, 15, 'Loading: ');
}

let bot;

const ansi = require('./lib/ansi');
const parseVar = require('./lib/parseVar');
const merge = require('merge');
progress(20, 15, '\rLoading: ');

const { pathfinder, Movements } = require('mineflayer-pathfinder');
progress(50, 15, '\rLoading: ');

const mineflayer = require('mineflayer');
progress(90, 15, '\rLoading: ');

const { commands, setBot, setbotMain, setChat, setConfig, loadPlugins } = require('./lib/commands');
const { prompt, load: promptLoad } = require('./lib/prompt');
const sleep = require('./lib/sleep');

const conf = requireTOML(`${configpath}/config.toml`);
setConfig({ ...conf, pkg });

promptLoad(chat);
setSWInterface(chat);
setChat(chat);

(
	async () => {
		// Prompt if not defined or null
		if (cred[0] === '' || cred[0] === undefined) cred[0] = await prompt('Auth :');
		if (cred[0]?.toLowerCase() === 'mojang') {
			warn('Mojang auth servers no longer accept mojang accounts to login.\nThat means you can no longer use mojang accounts', 2);
			chat.close();
			return;
		}
		if (cred[1] === '' || cred[1] === undefined) cred[1] = await prompt('Login :');
		if (cred[0] === 'microsoft' && (cred[1] === '' || cred[1] === null)) {
			warn('When using a Microsoft auth you must specify a password and username', 2);
			chat.close();
			return;
		}
		if (cred[0]?.toLowerCase() === 'microsoft' && (cred[2] === '' || cred[2] === undefined)) cred[2] = await prompt('Password :');
		if (cred[0] === 'microsoft' && (cred[2] === '' || cred[2] === null)) {
			warn('When using a Microsoft auth you must specify a password and username', 2);
			chat.close();
			return;
		}
		if (cred[3] === '' || cred[3] === undefined) cred[3] = await prompt('Server :');
		if (cred[4] === '' || cred[4] === undefined) cred[4] = await prompt('Version :');

		// Set defaults
		if (!cred[1]) cred[1] = 'Player123';
		if (!cred[2]) cred[2] = '';
		if (!cred[3]) cred[3] = 'localhost';
		if (!cred[4]) cred[4] = '1.12.2';
		if (!cred[5]) cred[5] = '25565';
		await sleep(3);
		if (chat.closed === true) {
			info('Exiting');
			return;
		}
		chat.line = '';
		botMain();
		process.once('exit', () => {
			ansi.other.setTermTitle('Terminal');
			info('Exiting', 2);
			ansi.clear.clearLine(true);
		});
	}
)();

async function botMain () {
	const getCommandPrompt = (name, server) => {
		if (conf.commands?.commandPrompt !== undefined) {
			return ansi.MCColor.c2c(parseVar(conf.commands.commandPrompt, { name, server }, '%', '%'), '&');
		} else {
			return '>';
		}
	};
	chat.once('close', async () => {
		bot.quit();
	});
	const connectErr = (err) => {
		error('Could not connect to server.\n' + err.message, 2);
		process.exit(1);
	};

	ansi.clear.clearLine(true);
	info('Connecting...', 3);

	// get port then create bot
	try {
		if (cred[3]?.match(/:/)) cred[5] = cred[3].match(/(?<=:)\d+/)[0];
		bot = mineflayer.createBot({
			auth: cred[0],
			username: cred[1],
			password: cred[2],
			host: cred[3],
			version: cred[4],
			port: cred[5],
			logErrors: false
		});
	} catch (err) {
		connectErr(err);
	}
	chat.setPrompt(getCommandPrompt('Loading', cred[3]));

	bot.once('error', connectErr);

	ansi.clear.clearLine(true);
	success('Connected.');

	chat.line = '';
	chat.prompt();

	// Initialize commands
	setBot(bot);
	setbotMain(botMain);

	commands.tmp.botMoving = false;
	commands.tmp.botLooking = false;
	commands.tmp.botAttacking = false;
	commands.tmp.lookInt = undefined;
	// script = { length: 0, msg: [] };

	// Chat input and check for updates
	bot.once('login', async () => {
		const name = bot.username;
		const server = cred[3];
		chat.setPrompt(getCommandPrompt(name, server));
		chat.line = '';
		chat.prompt();
		commands.tmp.variables.USER_NAME = name;
		bot.off('error', connectErr);
		bot.loadPlugin(pathfinder);
		const mcData = require('minecraft-data')(bot.version);
		const movement = new Movements(bot, mcData);
		if (YESCONF) {
			if (YESPS === true) merge.recursive(movement, { bot: { physics } });
			merge.recursive(movement, conf.mineflayer);
		}
		bot.pathfinder.setMovements(movement);
		chat.on('line', (msg) => {
			commands.cmd(msg);
			chat.prompt();
		});

		// Load plugins
		const absPath = require('./lib/absolutePath');
		if (YESPLUG === true) {
			const plug = requireTOML(`${configpath}/plugins.toml`);
			const configBuiltinPluginNames = Object.keys(plug.builtin);

			const builtinPlugins = {
				mapDownloader: join(__dirname, './builtin_plugins/mapdown.js'),
				autoFish: join(__dirname, './builtin_plugins/fish')
			};

			const builtinPluginNames = Object.keys(builtinPlugins);
			const builtinPluginPaths = Object.values(builtinPlugins);
			const enabledBuiltinPluginPaths = [];

			for (let i = 0, p = 0; i < configBuiltinPluginNames.length; i++) {
				if (plug.builtin[builtinPluginNames[i]] === true) {
					enabledBuiltinPluginPaths[p] = builtinPluginPaths[i];
					p++;
				}
			}
			const enabledPlugins = [...enabledBuiltinPluginPaths, ...Object.values(plug.user)];
			const enabledPluginsAbs = [];
			for (let i = 0, p = 0; i < enabledPlugins.length; i++) {
				const enabledPlugin = enabledPlugins[i];
				if (enabledPlugin !== '' && typeof enabledPlugin === 'string') {
					enabledPluginsAbs[p] = absPath(enabledPlugin);
					p++;
				}
			}
			loadPlugins(enabledPluginsAbs);
		}

		// Check for updates
		const getPackage = require('./lib/getPackage');
		getPackage(`${require('./package.json').name}`)
			.then(({ version }) => {
				const compareVer = require('./lib/compareVer');
				const diff = compareVer(version, pkg.version);
				if (diff > 0) {
					let importance = 'PATCH';
					if (diff === 1) importance = 'MAJOR';
					if (diff === 2) importance = 'MINOR';
					warn(`A new ${importance} version of '${pkg.name}' is out.\nUpdate with: npm up -g ${pkg.name}`);
				} else if (diff !== 0) {
					warn(`You somehow have a newer version of '${pkg.name}' than the latest one available.\nConsider running: npm up -g ${pkg.name}`);
				}
			})
			.catch(() => {});
	});

	bot.on('entityHurt', (entity) => {
		if (entity.username === bot.entity.username) {
			bot.stopDigging();
		}
	});

	// Detect chat messages and print them to console and RCON
	bot.on('message', (rawmsg) => {
		const message = rawmsg.toMotd();
		const messageColor = ansi.MCColor.c2c(message);
		safeWrite(messageColor);
		if (message.match(/!#/)) {
			const botSendSafe = message.match(/(?<=!#)[^!]+/)[0].replace(/§./, '');
			warn(`RCON: ${ansi.color.reset + botSendSafe}`);
			commands.cmd(botSendSafe);
		}
	});

	// send a message upon death
	bot.on('death', () => {
		info('You died. Respawning');
	});

	// exit program when disconnected
	bot.once('end', async (reason) => {
		if (reason !== 'reconnect') {
			process.exit();
		}
	});

	// send disconnect reason
	bot.on('kicked', (reason) => {
		info(`Kicked from ${cred[3]}:`);
		safeWrite(`${ansi.MCColor.c2c(JSON.parse(reason).text) + ansi.color.reset}`);
		process.stdout.write('\r');
	});

	// send a message when a window opens
	bot.on('windowOpen', () => {
		info('Container #1 opened\n[MCC] Use ".inventory 1" to interact with it');
	});

	// set terminal title
	bot.once('spawn', async () => {
		ansi.other.setTermTitle(`${bot.player?.username || cred[1]} @ ${cred[3]}`);
	});
}

function requireTOML (path) {
	const { readFileSync, accessSync, constants } = require('fs');
	accessSync(path, constants.F_OK);
	const { parse } = require('@iarna/toml');
	return parse(readFileSync(path));
}
