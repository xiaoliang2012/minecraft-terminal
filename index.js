#!/usr/bin/node
const getopt = require('./lib/getopts');

// Get help
getopt(['--help', '-h'], 0, () => {
	console.log(`Usage:
  --no-conf, -nc      Do not use the configuration file.
  --no-cred, -ns      Do not use the credentials file.
  --cred, -c          <Auth> <Username> <Password> <Version> <Server>
                      Override credentials from CLI arguments.
  --help, -h          Show this help message.
  --version, -v       Show version information.`);
	process.exit();
});

// Get version
getopt(['--version', '-v'], 0, () => {
	console.log(`MCCinJS version: ${require('./package.json').version}\nNode version: ${process.version}`);
	process.exit();
});

let cred = {};

// Do not use the ./config/cred.ini file for credentials
getopt(['--no-cred', '-nc'], 0, () => {
	cred.nocred = true
});

// Do not use the ./config/conf.ini file for configuration
getopt(['--no-conf', '-ns'], 0, () => {
	cred.noconf = true
});

// Get credentials from CLI arguments
getopt(['--cred', '-c'], 6, (params) => {
	for (let b = 1; b < params.length; b++) {
		if (params[b] !== '!') {
			if (b === 1) cred.auth = params[b];
			else if (b === 2) cred.username = params[b];
			else if (b === 3) cred.password = params[b];
			else if (b === 4) cred.server = params[b];
			else if (b === 5) cred.version = params[b];
		}
	}
});

const progress = require('./lib/progress');
process.stdout.write('Loading: ' + progress(0, 15));

const readline = require('readline');
const chat = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

require('events').EventEmitter.defaultMaxListeners = 0;

const ini = require('./lib/ini');
const fs = require('fs');

if (!cred.nocred && fs.existsSync('./config/cred.ini')) {
	cred = { ...ini.parse(fs.readFileSync('./config/cred.ini', 'utf-8')), ...cred };
} else {
	if (cred.nocred) process.stdout.write('\rNot using "cred.ini" because of --no-cred\nLoading: ' + progress(0, 15));
	else process.stdout.write('\rFile "cred.ini" not found\nLoading: ' + progress(0, 15));
	cred = { ...{ auth: '', username: '', password: '', server: '', version: '' }, ...cred };
}

if (!cred.noconf && fs.existsSync('./config/config.ini')) {
	// eslint-disable-next-line no-var
	var YESCONF = true;
} else if (!cred.noconf) process.stdout.write('\rFile "config.ini" not found. Using default settings\nLoading: ' + progress(0, 15));

let bot;
let botMoving = false;
let botAttacking = false;
let botLooking = false;
let hurtInt;
let lookInt;
let attackInt;
let script = { length: 0, msg: [] };

// const copy = require('./copy');
// const curpos = require('./lib/cursorpos');
const sleep = require('./lib/sleep');
const ansi = require('./lib/ansi');
const distance = require('./lib/distance');
const merge = require('merge');
const v = require('vec3');

process.stdout.write('\rLoading: ' + progress(30, 15));
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder');
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
					if (!cred.server) cred.server = ip;
					process.stdout.write(ansi.color.reset);
					await sleep(0.01);
					cred.accept = true;
					chat.pause();
				});
				// 5
				if (!cred.version) cred.version = ver;
				if (!cred.server && cred.server != null) {
					chat.setPrompt('Server :');
					chat.prompt();
				} else chat.emit('line');
			});
			// 4
			if (!cred.password) cred.password = pass;
			if (!cred.version && cred.version != null) {
				chat.setPrompt('Version :');
				chat.prompt();
			} else chat.emit('line');
		});
		// 3
		if (!cred.username) cred.username = name;
		if (!cred.password && cred.password != null) {
			chat.setPrompt('Password :');
			chat.prompt();
		} else chat.emit('line');
	});
	// 2
	if (!cred.auth) cred.auth = AUTH;
	if (!cred.username && cred.username != null) {
		chat.setPrompt('Login :');
		chat.prompt();
	} else chat.emit('line');
});
process.stdout.write('\rLoading: ' + progress(100, 15));
// 1
if (!cred.auth && cred.auth != null) {
	chat.setPrompt('Auth :');
	chat.prompt('line');
} else chat.emit('line');

chat.once('pause', () => {
	if (!cred.username) cred.username = 'MCCinJS';
	if (!cred.server) cred.server = 'localhost';
	if (!cred.version) cred.version = '1.8.9';
	if (cred.accept) {
		ansi.other.setTermTitle(`${cred.username} @ ${cred.server}`);
		botStuff();
	} else console.log('\nExiting');
});

async function botStuff () {
	ansi.clear.clearLine(true);
	process.stdout.write('Connecting...')
	botMoving = false;
	botAttacking = false;
	botLooking = false;
	lookInt = undefined;
	// script = { length: 0, msg: [] };

	// DO NOT REMOVE
	hurtInt = undefined;

	// get port then create bot
	if (cred.server?.match(/:/)) cred.port = cred.server.match(/(?<=:)\d+/)[0];
	bot = createBot(cred.server, cred.port, cred.username, cred.password, cred.auth, cred.version);
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
			console.log('\nExiting');
			ansi.other.setTermTitle('Terminal');
			ansi.clear.clearLine(true);
			bot.quit();
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
		safeWrite(`${ansi.color.dim}[MCC] You died. Respawning${ansi.color.reset}`);
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
		safeWrite(`${ansi.color.dim}[MCC] Kicked from ${cred.server}:${ansi.color.reset}`);
		safeWrite(`${ansi.MCColor.c2c(JSON.parse(reason).text) + ansi.color.reset}`);
		process.stdout.write('\r');
	});

	// send a message when a window opens
	bot.on('windowOpen', () => {
		safeWrite(`${ansi.color.dim}[MCC] Container #1 opened\n[MCC] Use ".inventory 1" to interact with it${ansi.color.reset}`);
	});
	// stop bot from moving when hurt
	bot.on('entityHurt', async (entity) => {
		if (botMoving) {
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
			const conf = ini.parse(fs.readFileSync('./config/config.ini', 'utf-8'));
			merge.recursive(movement, conf);
		}
		bot.pathfinder.setMovements(movement);
	});
}

const commands = {};
commands.exit = () => {
	bot.quit();
};

commands.reco = async () => {
	safeWrite(`${ansi.color.dim}[MCC] Reconnecting${ansi.color.reset}`);
	chat.removeAllListeners();
	bot.quit('reconnect');
	chat.pause();
	await sleep(100);
	bot.removeAllListeners();
	botStuff();
};

commands.move = async (direction, distanceVar) => {
	if (direction && (distanceVar === undefined || distanceVar > 0.5)) {
		let north = 0;
		let south = 0;
		let east = 0;
		let west = 0;
		let howFar = 1;
		if (distanceVar) howFar = distanceVar;
		if (direction === 'north') north = -howFar;
		else if (direction === 'south') south = howFar - 0;
		else if (direction === 'east') east = howFar - 0;
		else if (direction === 'west') west = -howFar;

		if (!bot.pathfinder.isMoving() || botMoving) {
			let failed = false;
			let unit;
			if (howFar === '1') unit = 'block';
			else unit = 'blocks';
			const time = Date.now();
			safeWrite(`${ansi.color.dim}[MCC] Attempting to move ${direction} for ${howFar} ${unit}${ansi.color.reset}`);

			try {
				await bot.pathfinder.goto(new GoalNear(bot.entity.position.x + east + west, bot.entity.position.y, bot.entity.position.z + south + north, 0));
			} catch (error) {
				failed = true;
				console.log(error);
				safeWrite(`${ansi.color.dim}[MCC] ${error.message}\n[MCC] Can't move${ansi.color.reset}`);
			}
			if (!failed) {
				if (Date.now() - time < 100) safeWrite(`${ansi.color.dim}[MCC] Can't move${ansi.color.reset}`);
				else safeWrite(`${ansi.color.dim}[MCC] Moved ${direction} for ${howFar} ${unit}${ansi.color.reset}`);
			}
		}
	} else safeWrite(`${ansi.color.dim}[MCC] Usage: .move <Direction> <distance?>. Direction = <north|south|east|west> distance > 0.5${ansi.color.reset}`);
};

commands.follow = (player, range) => {
	if (botMoving === false) {
		if (player && range > 1) {
			let unit;
			if (range === '1') unit = 'block';
			else unit = 'blocks';
			botFollow(bot, range, player);
			safeWrite(`${ansi.color.dim}[MCC] Following ${player} with a range of ${range} ${unit}${ansi.color.reset}`);
		} else safeWrite(`${ansi.color.dim}[MCC] Usage: .follow <Player> <Range>. Range > 1${ansi.color.reset}`);
	} else safeWrite(`${ansi.color.dim}[MCC] Player is already following someone. Use ".unfollow"${ansi.color.reset}`);
};

commands.unfollow = () => {
	botUnfollow();
	safeWrite(`${ansi.color.dim}[MCC] Not following anyone${ansi.color.reset}`);
};

commands.attack = (player, cps, reach, minreach) => {
	if (botAttacking === false) {
		if (player && cps > 0 && reach > 0 && reach > minreach) {
			botAttacking = true;
			safeWrite(`${ansi.color.dim}[MCC] Attacking ${player} with ${cps}CPS if MinReach(${minreach}) < distance < MaxReach(${reach})${ansi.color.reset}`);
			attackInt = setInterval(() => {
				if (botAttacking === true) botAttack(bot, reach, minreach, player);
				else clearInterval(attackInt);
			}, 1000 / cps);
		} else safeWrite(`${ansi.color.dim}[MCC] Usage: .attack <Player> <CPS> <MaxReach> <MinReach>. MaxReach > MinReach (Duh), CPS > 0${ansi.color.reset}`);
	} else safeWrite(`${ansi.color.dim}[MCC] Player is already attacking someone. Use ".stopattack"${ansi.color.reset}`);
};

commands.stopattack = () => {
	if (botAttacking === true) botAttacking = false;
	safeWrite(`${ansi.color.dim}[MCC] Not attacking anyone${ansi.color.reset}`);
};

commands.send = (msg) => {
	if (msg) bot.chat(msg);
	else safeWrite(`${ansi.color.dim}[MCC] Usage: .send <Message>${ansi.color.reset}`);
};
// REdO COMMANDS.INVENTORY PLEASE ITS SO BAD
commands.inventory = async (id, action, slot1, slot2) => {
	let window;
	if (id === 'container' || id === '1') {
		if (bot.currentWindow) window = true;
		else {
			safeWrite(`${ansi.color.dim}[MCC] There is no container opened right now${ansi.color.reset}`);
			return;
		}
	} else if (id === 'inventory' || id === '0') window = false;
	else {
		// CHANGE THIS
		safeWrite(`${ansi.color.dim}[MCC] Usage: .inventory <ID: inventory|container|0|1> <Action?: click|move|drop|dropall> <Arg1?> <Arg2?>${ansi.color.reset}`);
		return;
	}
	if (action === undefined && slot1 === undefined && slot2 === undefined) {
		let invv = '';
		process.stdout.write(ansi.color.dim);
		if (window) {
			const items = getItems(bot.currentWindow);
			for (let i = 0; i < getItems(bot.currentWindow).length; i++) {
				if (items[i].nbt?.value?.display?.value?.Name) {
					items[i].namee = items[i].nbt.value.display.value.Name.value.replace(/§./gm, '');
				} else {
					items[i].namee = items[i].name + ':' + items[i].metadata
				}
				invv = `${invv}   | #${items[i].slot}: x${items[i].count}  ${items[i].namee}  \n`;
			}
			safeWrite(invv);
		} else {
			const items = bot.inventory.items();
			for (let i = 0; i < bot.inventory.items().length; i++) {
				if (items[i].slot - bot.inventory.hotbarStart >= 0) {
					items[i].hotbar = (items[i].slot - bot.inventory.hotbarStart);
				} else {
					items[i].hotbar = '';
				}
				if (items[i]?.nbt?.value?.display?.value?.Name?.value) {
					items[i].namee = items[i].nbt.value.display.value.Name.value.replace(/§./gm, '');
				} else {
					items[i].namee = `${items[i].name}:${items[i].metadata}`;
				}
				invv = `${invv} ${items[i].hotbar} | #${items[i].slot}: x${items[i].count}  ${items[i].namee}  \n`;
			}
			safeWrite(`${invv}Selected slot: ${bot.quickBarSlot}`);
		}
		process.stdout.write(ansi.color.reset);
	} else if (action === 'click' && !isNaN(slot1)) {
		safeWrite(`${ansi.color.dim}[MCC] Left clicking slot ${slot1} in window #${id}${ansi.color.reset}`);
		bot.clickWindow(slot1, 0, 0);
	} else if (action === 'move' && !isNaN(slot1) && !isNaN(slot2)) {
		safeWrite(`${ansi.color.dim}[MCC] Moving item at slot ${slot1} to slot ${slot2} in window #${id}${ansi.color.reset}`);
		bot.clickWindow(slot1, 0, 0);
		bot.clickWindow(slot2, 0, 0);
	} else if (action === 'drop' && !isNaN(slot1)) {
		safeWrite(`${ansi.color.dim}[MCC] Dropping item at slot ${slot1} in window #${id}${ansi.color.reset}`);
		bot.clickWindow(slot1, 0, 0);
		bot.clickWindow(-999, 0, 0);
	} else if (action === 'dropall') {
		let items;
		if (window) {
			items = getItems(bot.currentWindow);
		} else {
			items = bot.inventory.items();
		}
		if (isNaN(slot1)) slot1 = 0;
		safeWrite(`${ansi.color.dim}[MCC] Dropping all items in window #${id}${ansi.color.reset}`);
		for (let i = 0; i < items.length; i++) {
			bot.clickWindow(items[i].slot, 0, 0);
			await sleep(slot1);
			bot.clickWindow(-999, 0, 0);
		}
	} else safeWrite(`${ansi.color.dim}[MCC] Usage: .inventory <ID: inventory|container|0|1> <Action?: click|move|drop|dropall> <Slot1?> <Slot2?>${ansi.color.reset}`);
};

commands.useitem = async (sec) => {
	if (!sec) sec = 0.1
	bot.activateItem();
	await sleep(sec * 1000);
	bot.deactivateItem();
	safeWrite(`${ansi.color.dim}[MCC] Used an item for ${sec} seconds${ansi.color.reset}`);
};

commands.changeslot = (slot) => {
	if (!isNaN(slot) && slot > -1 && slot < 9) {
		bot.setQuickBarSlot(slot);
		safeWrite(`${ansi.color.dim}[MCC] Changed slot to ${slot + ansi.color.reset}`);
	} else safeWrite(`${ansi.color.dim}[MCC] Usage: .changeslot <Slot>. -1 < Slot < 9${ansi.color.reset}`);
};

commands.script = (pathToSrc) => {
	if (!pathToSrc) {
		safeWrite(`${ansi.color.dim}[MCC] Usage: .script <Path> <Condition>${ansi.color.reset}`);
		return;
	}
	fs.access(pathToSrc, fs.F_OK, (err) => {
		if (err) {
			safeWrite(`${ansi.color.dim}[MCC] Unable to access file. Does it exist?${ansi.color.reset}`);
			return;
		}
		const file = fs.createReadStream(pathToSrc);
		const readInterface = readline.createInterface({
			input: file,
			output: null,
			console: false
		});
		readInterface.on('line', async (msg) => {
			script.msg[script.length] = msg;
			script.length++;
		});
		readInterface.once('close', async () => {
			safeWrite(`${ansi.color.dim}[MCC] Reading script${ansi.color.reset}`);
			let inps
			let inp
			for (let i = 0; i < script.length; i++) {
				if (script.msg[i] === '') return;
				inps = [];
				inps[0] = script.msg[i];
				if (script.msg[i].match(/(?<= ).+/)) inps[1] = script.msg[i].match(/(?<= ).+/)[0];
				inp = inps[0].match(/[^ ]+/g);
				if (inp[0] === 'wait') await sleep(inp[1] * 1000);
				else optcmd(inp, inps);
			}
			script = { length: 0, msg: [] };
			await sleep(200);
			safeWrite(`${ansi.color.dim}[MCC] Reached end of script${ansi.color.reset}`);
		});
	});
};

commands.forceMove = async (direction, time) => {
	if ((direction === 'up' || direction === 'forward' || direction === 'back' || direction === 'left' || direction === 'right' || direction === 'sprint') && !isNaN(time)) {
		safeWrite(`${ansi.color.dim}[MCC] Moving ${direction} for ${time} seconds${ansi.color.reset}`);
		if (direction === 'up') direction = 'jump';
		bot.setControlState(direction, true);
		await sleep(time * 1000);
		bot.setControlState(direction, false);
	} else safeWrite(`${ansi.color.dim}[MCC] Usage: .forcemove <Dircetion:up|forward|back|left|right> <Time:Seconds>${ansi.color.reset}`);
};

commands.look = (who, reach, minreach, force) => {
	if (who && reach > 0 && (minreach === undefined || reach > minreach)) {
		if (!minreach) minreach = reach;
		if (botAttacking) {
			safeWrite(`${ansi.color.dim}[MCC] Bot is attacking someone. Use ".stopattack" ${ansi.color.reset}`);
			return;
		}
		if (botLooking) {
			safeWrite(`${ansi.color.dim}[MCC] Bot is looking at someone. Use ".stoplook" ${ansi.color.reset}`);
			return
		}
		botLooking = true;
		if (force === 'yes' || force === 'y') {
			lookInt = setInterval(() => {
				if (!botLooking) clearInterval(lookInt);
				if (bot.players[who]?.entity?.position) {
					const dist = distance(bot.players[who]?.entity?.position, bot.entity.position);
					if (dist < reach && dist > minreach) bot.lookAt(v(bot.players[who].entity.position.x, bot.players[who].entity.position.y + 1.585, bot.players[who].entity.position.z, true));
				}
			}, 100);
		} else {
			lookInt = setInterval(() => {
				if (!botLooking) clearInterval(lookInt);
				if (bot.players[who]?.entity?.position) {
					const dist = distance(bot.players[who]?.entity?.position, bot.entity.position);
					if (dist < reach && dist > minreach) bot.lookAt(v(bot.players[who].entity.position.x, bot.players[who].entity.position.y + 1.585, bot.players[who].entity.position.z));
				}
			}, 100);
		}
		let withForce = 'without';
		if (force) withForce = 'with';
		safeWrite(`${ansi.color.dim}[MCC] Looking at ${who} if MinReach(${minreach}) < distance < MaxReach(${reach}) ${withForce} force${ansi.color.reset}`);
	} else safeWrite(`${ansi.color.dim}[MCC] Usage: .look <Player> <MaxReach> <MinReach> <Force?:yes|y|no|n>. MaxReach > MinReach (duh) ${ansi.color.reset}`);
};

commands.stoplook = () => {
	botLooking = false;
	safeWrite(`${ansi.color.dim}[MCC] Not looking at anyone${ansi.color.reset}`);
};

/**
 * The commands.control function sets the control state of the bot.
 *
 * @param control Used to Set the control state of a specific control.
 * @param state Used to Determine whether the control is set to true or false.
 * @return Nothing.
 *
 */
commands.control = (control, state) => {
	console.log(state);
	if (['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak'].includes(control) && (state === 'false' || state === 'true')) {
		if (state === 'true') bot.setControlState(control, true);
		else if (state === 'false') bot.setControlState(control, false);
		safeWrite(`${ansi.color.dim}[MCC] Set control state ${control} to ${state + ansi.color.reset}`);
	} else if (control === 'clearall') {
		bot.clearControlStates();
		safeWrite(`${ansi.color.dim}[MCC] Cleared all control states${ansi.color.reset}`);
	} else safeWrite(`${ansi.color.dim}[MCC] Usage: .control <Control: forward|back|left|right|jump|sneak> <State: true, false>${ansi.color.reset}`);
};

/**
 * The commands.help function prints a help message to the console.
 *
 * @return Nothing.
 *
 */
commands.help = () => {
	safeWrite(`${ansi.color.dim}[MCC]
.exit           Exits the program
.reco           Reconnects to server
.move           Move in a certain direction
.follow         Follows a player
.unfollow       Stops following
.attack         Attacks a player
.stopattack     Stops attacking
.send           Sends a message
.inventory      Inventory management
.useitem        Use a held item
.changeslot     Change held hotbar slot
.script         Runs an MCC script
.help           Shows this help message${ansi.color.reset}`);
};

commands.list = () => {
	let out = '';
	for (const player in bot.players) {
		if (Object.hasOwnProperty.call(bot.players, player)) {
			const playerInfo = bot.players[player];
			out = `${out} ${playerInfo.username} [${playerInfo.ping}]`;
		}
	}
	safeWrite(`${ansi.color.dim}[MCC] Player list:${out + ansi.color.reset}`);
};

commands.cmd = (msg) => {
	if (msg === '') {
		chat.prompt();
		return;
	}
	if (msg.match(/(?<=^\.)./)) {
		const tmp = msg.match(/(?<=^\.).+/)[0];
		const inps = [];
		inps[0] = tmp;
		if (tmp.match(/(?<= ).+/)) inps[1] = tmp.match(/(?<= ).+/)[0];
		const inp = inps[0].match(/[^ ]+/g);
		optcmd(inp, inps);
	} else {
		bot.chat(msg);
	}
};

function optcmd (inp, inps) {
	switch (inp[0]) {
	case 'exit': commands.exit(); break;
	case 'reco': commands.reco(); break;
	case 'move': commands.move(inp[1], inp[2]); break;
	case 'forcemove': commands.forceMove(inp[1], inp[2]); break;
	case 'follow': commands.follow(inp[1], inp[2]); break;
	case 'unfollow': commands.unfollow(); break;
	case 'attack': commands.attack(inp[1], inp[2], inp[3], inp[4]); break;
	case 'stopattack': commands.stopattack(); break;
	case 'send': commands.send(inps[1]); break;
	case 'inventory': commands.inventory(inp[1], inp[2], inp[3], inp[4]); break;
	case 'useitem': commands.useitem(inp[1]); break;
	case 'changeslot': commands.changeslot(inp[1]); break;
	case 'script': commands.script(inp[1]); break;
	case 'look': commands.look(inp[1], inp[2], inp[3], inp[4]); break;
	case 'stoplook': commands.stoplook(inp[1]); break;
	case 'control': commands.control(inp[1], inp[2]); break;
	case 'help': commands.help(); break;
	case 'list': commands.list(); break;
	default: safeWrite(`${ansi.color.dim}[MCC] Command not found${ansi.color.reset}`);
	}
}

/**
 * The getItems function returns an array of non empty items from the window.slots
 * property.
 *
 * @param {object} window Used to Access the window object.
 * @return {array} An array of items from the window.
 *
 */
function getItems (window) {
	let p = 0;
	const items = []
	for (let i = 0; i < window.slots.length; i++) {
		if (window.slots[i]) {
			items[p] = window.slots[i];
			p++;
		}
	}
	return items;
}

/**
 * The botUnfollow function follows the player that is currently being followed.
 *
 * @return Nothing.
 *
 */
function botUnfollow () {
	botMoving = false;
}

/**
 * The botFollow function is used to follow a player around the world.
 *
 * @param bot Used to Access the bot's pathfinder.
 * @param RANGE_GOAL Used to Determine how far the bot will go to get to a player.
 * @param who Used to Determine which player to follow.
 * @return The botmoving variable.
 *
 */
async function botFollow (bot, RANGE_GOAL, who) {
	let time
	// var tarposition
	let goal
	// initialize target position
	if (who) botMoving = true
	else botMoving = false
	// eslint-disable-next-line no-unmodified-loop-condition
	while (botMoving === true) {
		if (bot.players[who]?.entity?.position) {
			if (distance(bot.players[who]?.entity?.position, bot.entity.position) > RANGE_GOAL) {
				try {
					time = Date.now();
					goal = new GoalNear(bot.players[who].entity.position.x, bot.players[who].entity.position.y, bot.players[who].entity.position.z, RANGE_GOAL);
					await bot.pathfinder.goto(goal);
				} catch (error) {
					safeWrite(`${ansi.color.dim}[MCC] ${error.message} Retrying in 0.2 seconds${ansi.color.reset}`);
					await sleep(200);
				}
				if (Date.now() - time < 95) {
					await sleep(100);
				}
			} else await sleep(50);
		} else await sleep(1000);
	}
}

/**
 * The botAttack function is used to attack a player.
 *
 * @param bot Used to Access the bot's entity.
 * @param reach Used to Determine how far the bot can reach.
 * @param minreach Used to Make sure the bot doesn't attack when it's too close to the player.
 * @param who Used to Determine which player the bot is attacking.
 * @return True if the bot is attacking.
 *
 */
function botAttack (bot, reach, minreach, who) {
	const target = bot.players[who]?.entity?.position;
	if (target) {
		const dist = distance(bot.players[who]?.entity?.position, bot.entity.position);
		if (dist < reach && dist > minreach) {
			const lookAt = v(bot.players[who].entity.position.x, bot.players[who].entity.position.y + 1.585, bot.players[who].entity.position.z);
			bot.lookAt(lookAt, true);
			bot.attack(bot.players[who].entity);
		}
	}
}

function createBot (host, port, username, password, auth, ver) {
	return mineflayer.createBot({
		host: host || 'localhost',
		port: port || '25565',
		username: username || 'MCCinJS',
		password: password || '',
		auth: auth || 'mojang',
		version: ver || '1.12.2'
	});
}

async function safeWrite (msg, end) {
	if (!msg) msg = '';
	ansi.clear.clearLine(true);
	if (end === false) process.stdout.write(`${msg}\n${chat.line}`);
	else process.stdout.write(`${msg}\n>${chat.line}`);
}
