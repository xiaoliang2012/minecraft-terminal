#!/usr/bin/env node

const { error } = require('./lib/mccinfo');

const getopt = require('./lib/getopts');

// Get help
getopt(['--help', '-h'], 0, () => {
	process.stdout.write(`Usage:
   --no-conf, -nc           Do not use the configuration file.
   --no-cred, -ns           Do not use the credentials file.
   --set-conf-path, -scp    Set the config folder path
   --get-conf-path, -gcp    Get the config folder path
   --gen-conf, -gc          Generate configuration files
   --cred, -c               <Auth> <Username> <Password> <Version> <Server>
                            Override credentials from CLI arguments.
   --help, -h               Show this help message.
   --version, -v            Show version information.\n`);
	process.exit();
});

const pkg = require('./package.json');

// Get version
getopt(['--version', '-v'], 0, () => {
	process.stdout.write(`MC-Term version: ${pkg.version}\nNode version: ${process.version}\n`);
	process.exit();
});

const { join } = require('path');

getopt(['--gen-conf', '-gc'], 2, (params) => {
	const { cpSync } = require('fs');
	let dir = params[1] || '';
	if (!dir.match(/^\//m)) {
		dir = join(process.cwd(), dir);
	}
	cpSync(join(__dirname, 'config'), dir, { recursive: true });
	process.exit();
});

let dir;
if (process.platform === 'win32') dir = __dirname;
else dir = join(require('os').homedir(), '.config', 'mc-term');
const configPathPath = join(dir, '.configpath.json');
try {
	require.resolve(configPathPath);
} catch (error) {
	const { writeFileSync } = require('fs');
	if (!require('fs').existsSync(dir)) {
		const { mkdir } = require('fs');
		mkdir(dir, { recursive: true }, (err) => {
			if (err) throw err;
		});
	}
	writeFileSync(configPathPath, JSON.stringify({ configpath: 'NOT_SET_YET' }), (err) => {
		if (err) error(err);
	});
}

const configpath = require(configPathPath).configpath;

getopt(['--set-conf-path', '-scp'], 2, (params) => {
	const { editJSON } = require('./lib/editfile');
	if (params[1]) {
		editJSON(configPathPath, configPathPath, (data) => {
			data.configpath = join(process.cwd(), params[1]);
			return data;
		});
	}
	process.exit();
});

getopt(['--get-conf-path', '-gcp'], 0, () => {
	process.stdout.write(`Path to config: '${configpath}'\n`);
	process.exit();
});

const { safeWrite, setSWInterface, info, warn, success } = require('./lib/mccinfo');

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

// Do not use the ./config/credentials.json file for credentials
let bcofnc;
getopt(['--no-cred', '-nc'], 1, (params) => {
	cred[6] = true;
	bcofnc = params[0];
});

// Do not use the ./config/conf.json file for configuration
let bcofns;
getopt(['--no-conf', '-ns'], 1, (params) => {
	cred[7] = true;
	bcofns = params[0];
});

const progress = require('./lib/progress');
process.stdout.write('Loading: ' + progress(0, 15));
const readline = require('readline');
const chat = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

setSWInterface(chat);

let YESCONF = false;
if (!cred[7]) {
	try {
		if (require.resolve(join(configpath, 'config.json'))) YESCONF = true;
	} catch (e) {
		process.stdout.write('\r');
		error('File "config.json" not found. Using default settings', 1);
		process.stdout.write('Loading: ' + progress(0, 15));
	}
} else {
	process.stdout.write('\r');
	warn('Not using "config.json" because of ' + bcofns, 1);
	process.stdout.write('Loading: ' + progress(0, 15));
}

if (!cred[6]) {
	try {
		if (require.resolve(`${configpath}/credentials.json`)) {
			cred = Object.values(Object.assign({
				auth: undefined,
				username: undefined,
				password: undefined,
				server: undefined,
				version: undefined
			}, require(`${configpath}/credentials.json`)));
		}
	} catch (e) {
		process.stdout.write('\r');
		error('File "credentials.json" not found. Using default settings', 1);
		process.stdout.write('Loading: ' + progress(0, 15));
	}
} else {
	process.stdout.write('\r');
	warn('Not using "credentials.json" because of ' + bcofnc, 1);
	process.stdout.write('Loading: ' + progress(0, 15));
}

// Get credentials from CLI arguments
getopt(['--cred', '-c'], 6, (params) => {
	for (let i = 1; i < params.length; i++) {
		if (params[i] !== '!' && params[i] !== undefined) {
			cred[i - 1] = params[i];
		} else cred[i - 1] = null;
	}
});
const { commands, setBot, setbotMain, setChat } = require('./lib/commands');

setChat(chat);

require('events').EventEmitter.defaultMaxListeners = 0;

let YESPS;
let physics;
try {
	if (require.resolve(`${configpath}/physics.json`)) {
		physics = require(`${configpath}/physics.json`);
		if (physics.usePhysicsJSON === true) {
			process.stdout.write('\r');
			warn('Using custom physics. this will result in a ban in most servers!', 1);
			info('You can disable it by editing usePhysicsJSON in physics.json', 1);
			process.stdout.write('Loading: ' + progress(0, 15));
			YESPS = true;
		}
	}
} catch (e) {
	process.stdout.write('\r');
	error('File "physics.json" not found. Using default settings', 1);
	process.stdout.write('Loading: ' + progress(0, 15));
}

let bot;
let hurtInt;

const sleep = require('./lib/sleep');
const ansi = require('./lib/ansi');

const merge = require('merge');

process.stdout.write('\rLoading: ' + progress(30, 15));
const { pathfinder, Movements } = require('mineflayer-pathfinder');
process.stdout.write('\rLoading: ' + progress(80, 15));
const mineflayer = require('mineflayer');
// 1
chat.once('line', async (AUTH) => {
	// 2
	chat.once('line', (name) => {
		// 3
		chat.once('line', (pass) => {
			// 4
			chat.once('line', (ip) => {
				// 5
				chat.once('line', async (ver) => {
					if (!cred[4]) cred[4] = ver;
					process.stdout.write(ansi.color.reset);
					await sleep(0.01);
					cred[8] = true;
					chat.pause();
				});
				// 5
				if (!cred[3]) cred[3] = ip;
				if (cred[4] === '' || cred[4] === undefined) {
					chat.setPrompt('Version :');
					chat.prompt();
				} else chat.emit('line');
			});
			// 4
			if (!cred[2]) cred[2] = pass;
			if (cred[3] === '' || cred[3] === undefined) {
				chat.setPrompt('Server :');
				chat.prompt();
			} else chat.emit('line');
		});
		// 3
		if (!cred[1]) cred[1] = name;
		if ((cred[2] === '' || cred[2] === undefined) && cred[0] !== 'cracked') {
			chat.setPrompt('Password :');
			chat.prompt();
		} else chat.emit('line');
	});
	// 2
	if (!AUTH) AUTH = 'cracked';
	if (!cred[0]) cred[0] = AUTH;
	if (cred[1] === '' || cred[1] === undefined) {
		chat.setPrompt('Login :');
		chat.prompt();
	} else chat.emit('line');
});
process.stdout.write('\rLoading: ' + progress(100, 15));
// 1
if (cred[0] === '' || cred[0] === undefined) {
	chat.setPrompt('Auth :');
	chat.prompt('line');
} else chat.emit('line');

chat.once('pause', () => {
	if (!cred[1]) cred[1] = 'Player123';
	if (!cred[2]) cred[2] = '';
	if (!cred[3]) cred[3] = 'localhost';
	if (!cred[4]) cred[4] = '1.12.2';
	if (!cred[5]) cred[5] = '25565';
	if (cred[8]) {
		ansi.other.setTermTitle(`${cred[1]} @ ${cred[3]}`);
		process.on('exit', () => {
			ansi.other.setTermTitle('Terminal');
			ansi.clear.clearLine(true);
			info('Exiting', 1);
		});
		botMain();
	} else info('Exiting', 1);
});

async function botMain () {
	ansi.clear.clearLine(true);
	info('Connecting...', 2);

	// get port then create bot
	if (cred[3]?.match(/:/)) cred[5] = cred[3].match(/(?<=:)\d+/)[0];
	bot = mineflayer.createBot({
		host: cred[3],
		port: cred[5],
		username: cred[1],
		password: cred[2],
		auth: cred[0],
		version: cred[4]
	});

	bot.on('error', () => {
		error('Could not connect to server.\nRead the error above for more information');
	});

	ansi.clear.clearLine();
	success('Connected.');

	// Initialize commands
	setBot(bot);
	setbotMain(botMain);

	commands.tmp.botMoving = false;
	commands.tmp.botAttacking = false;
	commands.tmp.botLooking = false;
	commands.tmp.lookInt = undefined;
	// script = { length: 0, msg: [] };

	// DO NOT REMOVE
	hurtInt = undefined;

	// Chat input and check for updates
	bot.once('login', async () => {
		chat.resume();
		chat.setPrompt('>');
		chat.prompt();
		chat.on('line', (msg) => {
			commands.cmd(msg);
			process.stdout.write('\r>');
		});

		chat.on('pause', () => {
			chat.prompt(true);
		});
		chat.on('close', () => {
			bot.quit();
		});
		// Check for updates
		const getVer = require('./lib/getVer');
		getVer(`${require('./package.json').name}`)
			.then((ver) => {
				if (require('./lib/compareVer')(ver, pkg.version)) warn(`Outdated version of '${pkg.name}'. Update with: npm up -g ${pkg.name}`);
			})
			.catch((err) => error(err));
	});

	// Detect chat messages and print them to console and RCON
	bot.chatAddPattern = (/(.*) » (.*)/, 'chat');
	bot.on('message', (rawmsg) => {
		const message = rawmsg.toMotd();
		const messageColor = ansi.MCColor.c2c(message);
		safeWrite(messageColor);
		if (message.match(/!#/)) {
			const botSendSafe = message.match(/(?<=!#)[^!]+/)[0].replace(/§./, '');
			safeWrite(`${ansi.color.dim}[RCON] ${ansi.color.reset + botSendSafe}`);
			commands.cmd(botSendSafe);
		}
	});

	// send a message upon death
	bot.on('death', () => {
		info('You died. Respawning');
	});

	// exit program when disconnected
	bot.on('end', async (reason) => {
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
	// stop bot from moving when hurt
	bot.on('entityHurt', async (entity) => {
		if (commands.tmp.botMoving) {
			await sleep(10);
			let absvelo;
			// if (entity.username === attackTarget) bot.pathfinder.stop();
			if (entity.username !== bot.username) return;
			if (!hurtInt) {
				hurtInt = setInterval(() => {
					absvelo = bot.entity.velocity.y + 0.0784000015258789;
					if (absvelo < 0.12) {
						bot.pathfinder.stop();
						clearInterval(hurtInt);
					}
				}, 100);
			}
		}
	});

	// initialize movement
	bot.once('spawn', async () => {
		bot.loadPlugin(pathfinder);
		const mcData = require('minecraft-data')(bot.version);
		const movement = new Movements(bot, mcData);
		if (YESCONF) {
			const conf = require(`${configpath}/config.json`);
			if (YESPS === true) merge.recursive(movement, { bot: { physics } });
			merge.recursive(movement, conf);
		}
		bot.pathfinder.setMovements(movement);
	});
}
