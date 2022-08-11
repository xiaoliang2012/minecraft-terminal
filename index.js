#!/usr/bin/node
const getopt = require('./lib/getopts');

// Get help
getopt(['--help', '-h'], 0, () => {
	process.stdout.write(`Usage:
  --no-conf, -nc      Do not use the configuration file.
  --no-cred, -ns      Do not use the credentials file.
  --cred, -c          <Auth> <Username> <Password> <Version> <Server>
                      Override credentials from CLI arguments.
  --help, -h          Show this help message.
  --version, -v       Show version information.\n`);
	process.exit();
});

// Get version
getopt(['--version', '-v'], 0, () => {
	process.stdout.write(`MC-Term version: ${require('./package.json').version}\nNode version: ${process.version}\n`);
	process.exit();
});

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

// Do not use the ./config/cred.json file for credentials
getopt(['--no-cred', '-nc'], 0, () => {
	cred[6] = true
});

// Do not use the ./config/conf.json file for configuration
getopt(['--no-conf', '-ns'], 0, () => {
	cred[7] = true
});

const { safeWrite, setSWInterface, info, warn, error } = require('./lib/mccinfo');
const progress = require('./lib/progress');
process.stdout.write('Loading: ' + progress(0, 15));

// move this up!
if (!cred[6]) {
	try {
		cred = Object.values(Object.assign({
			auth: undefined,
			username: undefined,
			password: undefined,
			server: undefined,
			version: undefined
		}, require('./config/cred.json')));
	} catch (e) {
		process.stoudt.write('\r');
		error('File "cred.json" not found', 2);
		process.stdout.write('Loading: ' + progress(0, 15));
	}
} else {
	process.stdout.write('\r');
	warn('\rNot using "cred.json" because of --no-cred', 2);
	process.stoudtw.rite('Loading: ' + progress(0, 15));
}

// Get credentials from CLI arguments
getopt(['--cred', '-c'], 6, (params) => {
	for (let i = 1; i < params.length; i++) {
		if (params[i] !== '!') {
			cred[i - 1] = params[i];
		} else cred[i - 1] = null;
	}
});

const { commands, setBot, setbotMain, setChat } = require('./lib/commands');
const readline = require('readline');
const chat = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

setSWInterface(chat);
setChat(chat);

require('events').EventEmitter.defaultMaxListeners = 0;

if (!cred[7]) {
	try {
		// eslint-disable-next-line no-var
		if (require.resolve('./config/config.json')) var YESCONF = true;
	} catch (e) {
		process.stdout.write('\r');
		error('File "config.json" not found. Using default settings', 2);
		process.stdout.write('Loading: ' + progress(0, 15));
	}
}

let YESPS;
let physics;
try {
	if (require.resolve('./config/physics.json')) {
		physics = require('./config/physics.json');
		if (physics.usePhysicsJSON === true) {
			process.stdout.write('\r');
			warn('Using physics.json. this will result in a ban in most servers!', 1);
			info('You can disable it by editing usePhysicsJSON in physics.json', 2)
			process.stdout.write('\nLoading: ' + progress(0, 15));
			YESPS = true;
		};
	}
} catch (e) {
	process.stdout.write('\r');
	error('File "physics.json" not found. Using default settings', 2);
	process.stdout.write('\nLoading: ' + progress(0, 15));
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
			chat.once('line', (ver) => {
				// 5
				chat.once('line', async (ip) => {
					if (!cred[3]) cred[3] = ip;
					process.stdout.write(ansi.color.reset);
					await sleep(0.01);
					cred[8] = true;
					chat.pause();
				});
				// 5
				if (!cred[4]) cred[4] = ver;
				if (!cred[3] && cred[3] != null) {
					chat.setPrompt('Server :');
					chat.prompt();
				} else chat.emit('line');
			});
			// 4
			if (!cred[2]) cred[2] = pass;
			if (!cred[4] && cred[4] != null) {
				chat.setPrompt('Version :');
				chat.prompt();
			} else chat.emit('line');
		});
		// 3
		if (!cred[1]) cred[1] = name;
		if (!cred[2] && cred[2] != null) {
			chat.setPrompt('Password :');
			chat.prompt();
		} else chat.emit('line');
	});
	// 2
	if (!cred[0]) cred[0] = AUTH;
	if (!cred[1] && cred[1] != null) {
		chat.setPrompt('Login :');
		chat.prompt();
	} else chat.emit('line');
});
process.stdout.write('\rLoading: ' + progress(100, 15));
// 1
if (!cred[0] && cred[0] != null) {
	chat.setPrompt('Auth :');
	chat.prompt('line');
} else chat.emit('line');

chat.once('pause', () => {
	if (!cred[0]) cred[0] = 'mojang';
	if (!cred[1]) cred[1] = 'Player123';
	if (!cred[2]) cred[2] = '';
	if (!cred[3]) cred[3] = 'localhost';
	if (!cred[4]) cred[4] = '1.12.2';
	if (!cred[5]) cred[5] = '25565';
	if (cred[8]) {
		ansi.other.setTermTitle(`${cred[1]} @ ${cred[3]}`);
		botMain();
	} else process.stdout.write('\nExiting\n');
});

async function botMain () {
	ansi.clear.clearLine(true);
	process.stdout.write('Connecting...')
	commands.tmp.botMoving = false;
	commands.tmp.botAttacking = false;
	commands.tmp.botLooking = false;
	commands.tmp.lookInt = undefined;
	// script = { length: 0, msg: [] };

	// DO NOT REMOVE
	hurtInt = undefined;

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

	// Initialize commands
	setBot(bot);
	setbotMain(botMain);

	// Chat input
	bot.once('login', () => {
		chat.resume();
		chat.setPrompt('>');
		chat.prompt();
		chat.on('line', (msg) => {
			commands.cmd(msg)
			process.stdout.write('\r>')
		});

		chat.on('pause', () => {
			chat.prompt(true);
		});
		chat.on('close', () => {
			process.stdout.write('\nExiting\n');
			ansi.other.setTermTitle('Terminal');
			ansi.clear.clearLine(true);
			bot.quit();
			process.exit();
		});
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
			ansi.other.setTermTitle('Terminal');
			ansi.clear.clearLine(true);
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
			let absvelo
			// if (entity.username === attackTarget) bot.pathfinder.stop();
			if (entity.username !== bot.username) return;
			if (!hurtInt) {
				hurtInt = setInterval(() => {
					absvelo = bot.entity.velocity.y + 0.0784000015258789
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
			const conf = require('./config/config.json');
			if (YESPS === true) merge.recursive(movement, { bot: { physics } })
			merge.recursive(movement, conf);
		}
		bot.pathfinder.setMovements(movement);
	});
}
