const ansi = require('./ansi');
const sleep = require('./sleep');
const distance = require('./distance');
const v = require('vec3');
const fs = require('fs');
const readline = require('readline');
const parseStr = require('./parsestr');
const { goals } = require('mineflayer-pathfinder');

const commands = { tmp: {} };

commands.tmp.botMoving = false;
commands.tmp.botAttacking = false;
commands.tmp.botLooking = false;
commands.tmp.lookInt = false;

let chat;
let script = { length: 0, msg: [] };
let bot;
let botMain;

const setSafeWriteInterface = (swint) => {
	chat = swint;
};

const setBot = (Bot) => {
	bot = Bot;
};

const setbotMain = (botmain) => {
	botMain = botmain;
};

const safeWrite = (msg, end) => {
	if (!msg) msg = '';
	ansi.clear.clearLine(true);
	if (end === false) process.stdout.write(`${msg}\n${chat.line}`);
	else process.stdout.write(`${msg}\n>${chat.line}`);
}

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
	botMain();
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

commands.LOOK = (direction) => {
	let yaw
	switch (direction) {
	case 'north': yaw = 180; break;
	case 'south': yaw = 0; break;
	case 'east': yaw = -90; break;
	case 'west': yaw = 90; break;
	default:
		return false;
	}
	bot.look(-(Number(yaw) + 180) / 57.296329454, 0, true);
};

commands.move = (direction, distance) => {
	if (direction && (distance === undefined || distance > 0)) {
		if (!bot.pathfinder.isMoving() || !commands.tmp.botMoving) {
			let unit;
			if (distance === 1) unit = 'block';
			else unit = 'blocks';
			if (commands.LOOK(direction) === false) {
				safeWrite(`${ansi.color.dim}[MCC] Usage: .move <Direction> <distance?>. Direction = <north|south|east|west> distance > 0${ansi.color.reset}`);
				return;
			} else safeWrite(`${ansi.color.dim}[MCC] Attempting to move ${direction} for ${distance} ${unit}${ansi.color.reset}`);
			// fix this
			const sprint = bot.getControlState('sprint');
			bot.setControlState('sprint', false);
			const speed = bot.physics.playerSpeed; // 0.1 ?
			bot.setControlState('forward', true);
			console.log(bot.physics.playerSpeed);
			setTimeout(() => {
				bot.setControlState('forward', false);
				bot.setControlState('sprint', sprint);
			}, distance * (0.02315693325014 / speed) * 1000);
			// ^^
		}
	} else safeWrite(`${ansi.color.dim}[MCC] Usage: .move <Direction> <distance?>. Direction = <north|south|east|west> distance > 0${ansi.color.reset}`);
};

/**
 * The botFollow function is used to follow a player around the world.
 *
 * @param bot Used to Access the bot's pathfinder.
 * @param RANGE_GOAL Used to Determine how far the bot will go to get to a player.
 * @param who Used to Determine which player to follow.
 * @return Nothing.
 *
 */
async function botFollow (bot, RANGE_GOAL, who) {
	let time
	// var tarposition
	let goal
	// initialize target position
	if (who) commands.tmp.botMoving = true
	else commands.tmp.botMoving = false
	// eslint-disable-next-line no-unmodified-loop-condition
	while (commands.tmp.botMoving === true) {
		if (bot.players[who]?.entity?.position) {
			if (distance(bot.players[who]?.entity?.position, bot.entity.position) > RANGE_GOAL) {
				try {
					time = Date.now();
					goal = new goals.GoalNear(bot.players[who].entity.position.x, bot.players[who].entity.position.y, bot.players[who].entity.position.z, RANGE_GOAL);
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

commands.follow = (player, range) => {
	if (commands.tmp.botMoving === false) {
		if (player && range > 1) {
			let unit;
			if (range === 1) unit = 'block';
			else unit = 'blocks';
			botFollow(bot, range, player);
			safeWrite(`${ansi.color.dim}[MCC] Following ${player} with a range of ${range} ${unit}${ansi.color.reset}`);
		} else safeWrite(`${ansi.color.dim}[MCC] Usage: .follow <Player> <Range>. Range > 1${ansi.color.reset}`);
	} else safeWrite(`${ansi.color.dim}[MCC] Player is already following someone. Use ".unfollow"${ansi.color.reset}`);
};

/**
 * The botUnfollow function unfollows the player that is currently being followed.
 *
 * @return Nothing.
 *
 */
function botUnfollow () {
	commands.tmp.botMoving = false;
}

commands.unfollow = () => {
	botUnfollow();
	safeWrite(`${ansi.color.dim}[MCC] Not following anyone${ansi.color.reset}`);
};

/**
 * The botAttack function is used to attack a player.
 *
 * @param bot Used to Access the bot's entity.
 * @param reach Used to Determine how far the bot can reach.
 * @param minreach Used to Make sure the bot doesn't attack when it's too close to the player.
 * @param who Used to Determine which player the bot is attacking.
 * @return Nothing.
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

commands.attack = (player, cps, reach, minreach) => {
	if (commands.tmp.botAttacking === false) {
		if (player && cps > 0 && reach > 0 && reach > minreach) {
			commands.tmp.botAttacking = true;
			safeWrite(`${ansi.color.dim}[MCC] Attacking ${player} with ${cps}CPS if MinReach(${minreach}) < distance < MaxReach(${reach})${ansi.color.reset}`);
			commands.tmp.attackInt = setInterval(() => {
				if (commands.tmp.botAttacking === true) botAttack(bot, reach, minreach, player);
				else clearInterval(commands.tmp.attackInt);
			}, 1000 / cps);
		} else safeWrite(`${ansi.color.dim}[MCC] Usage: .attack <Player> <CPS> <MaxReach> <MinReach>. MaxReach > MinReach (Duh), CPS > 0${ansi.color.reset}`);
	} else safeWrite(`${ansi.color.dim}[MCC] Player is already attacking someone. Use ".stopattack"${ansi.color.reset}`);
};

commands.stopattack = () => {
	if (commands.tmp.botAttacking === true) commands.tmp.botAttacking = false;
	safeWrite(`${ansi.color.dim}[MCC] Not attacking anyone${ansi.color.reset}`);
};

commands.send = (msg) => {
	if (msg) bot.chat(msg);
	else safeWrite(`${ansi.color.dim}[MCC] Usage: .send <Message>${ansi.color.reset}`);
};

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

// REdO COMMANDS.INVENTORY PLEASE ITS SO BAD
commands.inventory = async (id, action, slot1, slot2) => {
	let window;
	if (id === 'container' || id === 1) {
		if (bot.currentWindow) window = true;
		else {
			safeWrite(`${ansi.color.dim}[MCC] There is no container opened right now${ansi.color.reset}`);
			return;
		}
	} else if (id === 'inventory' || id === 0) window = false;
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

commands.optcmd = (inp, inps) => {
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
	case 'lookat': commands.lookAt(inp[1], inp[2], inp[3], inp[4]); break;
	case 'look': commands.look(inp[1], inp[2], inp[3]); break;
	case 'stoplook': commands.stoplook(inp[1]); break;
	case 'control': commands.control(inp[1], inp[2]); break;
	case 'help': commands.help(); break;
	case 'list': commands.list(); break;
	default: safeWrite(`${ansi.color.dim}[MCC] Command not found${ansi.color.reset}`);
	}
}

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
				else commands.optcmd(inp, inps);
			}
			script = { length: 0, msg: [] };
			await sleep(200);
			safeWrite(`${ansi.color.dim}[MCC] Reached end of script${ansi.color.reset}`);
		});
	});
};

commands.lookAt = (who, reach, minreach, force) => {
	if (who && reach > 0 && (minreach === undefined || reach > minreach)) {
		if (!minreach) minreach = reach;
		if (commands.tmp.botAttacking) {
			safeWrite(`${ansi.color.dim}[MCC] Bot is attacking someone. Use ".stopattack" ${ansi.color.reset}`);
			return;
		}
		if (commands.tmp.botLooking) {
			safeWrite(`${ansi.color.dim}[MCC] Bot is looking at someone. Use ".stoplookAt" ${ansi.color.reset}`);
			return
		}
		commands.tmp.botLooking = true;
		if (force === 'yes' || force === 'y') {
			commands.tmp.lookInt = setInterval(() => {
				if (!commands.tmp.botLooking) clearInterval(commands.tmp.lookInt);
				if (bot.players[who]?.entity?.position) {
					const dist = distance(bot.players[who]?.entity?.position, bot.entity.position);
					if (dist < reach && dist > minreach) bot.lookAt(v(bot.players[who].entity.position.x, bot.players[who].entity.position.y + 1.585, bot.players[who].entity.position.z, true));
				}
			}, 100);
		} else {
			commands.tmp.lookInt = setInterval(() => {
				if (!commands.tmp.botLooking) clearInterval(commands.tmp.lookInt);
				if (bot.players[who]?.entity?.position) {
					const dist = distance(bot.players[who]?.entity?.position, bot.entity.position);
					if (dist < reach && dist > minreach) bot.lookAt(v(bot.players[who].entity.position.x, bot.players[who].entity.position.y + 1.585, bot.players[who].entity.position.z));
				}
			}, 100);
		}
		let withForce = 'without';
		if (force) withForce = 'with';
		safeWrite(`${ansi.color.dim}[MCC] Looking at ${who} if MinReach(${minreach}) < distance < MaxReach(${reach}) ${withForce} force${ansi.color.reset}`);
	} else safeWrite(`${ansi.color.dim}[MCC] Usage: .lookat <Player> <MaxReach> <MinReach> <Force?:yes|y|no|n>. MaxReach > MinReach (duh) ${ansi.color.reset}`);
};

commands.look = (a, b, c) => {
	if (a && isNaN(a)) {
		if (b === undefined) b = true;
		const dir = a;
		if (commands.LOOK(dir) === false) {
			safeWrite(`${ansi.color.dim}[MCC] Usage: .look <Direction?:north|south|east|west> <Yaw?> <Pitch?> <Force?> ${ansi.color.reset}`);
		} else safeWrite(`${ansi.color.dim}[MCC] Looking ${dir + ansi.color.reset}`)
	} else if (!isNaN(a) && !isNaN(b)) {
		safeWrite(`${ansi.color.dim}[MCC] Set Yaw to ${a} and Pitch to ${b + ansi.color.reset}`)
		if (c === undefined) c = true;
		bot.look(-(Number(a) + 180) / 57.296329454, -b / 57.296329454, c);
	} else safeWrite(`${ansi.color.dim}[MCC] Usage: .look <Direction?:north|south|east|west> <Yaw?> <Pitch?> ${ansi.color.reset}`);
};

commands.stoplook = () => {
	commands.tmp.botLooking = false;
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
	if (['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak'].includes(control) && typeof state === 'boolean') {
		bot.setControlState(control, state);
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
		const inp = parseStr(inps[0].match(/[^ ]+/g));
		commands.optcmd(inp, inps);
	} else {
		bot.chat(msg);
	}
};

module.exports = { commands, setBot, setbotMain, safeWrite, setSafeWriteInterface };
