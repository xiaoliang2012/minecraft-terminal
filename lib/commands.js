const ansi = require('./ansi');
const sleep = require('./sleep');
const distance = require('./distance');
const readline = require('readline');
const { safeWrite, info, warn, error, success } = require('./mccinfo');

let chat;
const setChat = (swint) => {
	chat = swint;
};

const commands = { tmp: {} };

commands.tmp.botMoving = false;
commands.tmp.botAttacking = false;
commands.tmp.botLooking = false;
commands.tmp.lookInt = false;

let script = { length: 0, msg: [] };
let bot;
let botMain;

const setBot = (Bot) => {
	bot = Bot;
};

const setbotMain = (botmain) => {
	botMain = botmain;
};

commands.exit = () => {
	bot.quit();
};

commands.reco = async () => {
	info('Reconnecting', 2);
	chat.removeAllListeners();
	chat.pause();
	bot.quit('reconnect');
	await sleep(100);
	bot.removeAllListeners();
	botMain();
};

commands.forceMove = async (direction, time) => {
	if ((direction === 'up' || direction === 'forward' || direction === 'back' || direction === 'left' || direction === 'right' || direction === 'sprint') && !isNaN(time)) {
		info(`Moving ${direction} for ${time} seconds`);
		if (direction === 'up') direction = 'jump';
		bot.setControlState(direction, true);
		await sleep(time * 1000);
		bot.setControlState(direction, false);
	} else info('Usage: .forcemove <Dircetion:up|forward|back|left|right> <Time:Seconds>');
};

commands.LOOK = (direction) => {
	let yaw;
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

commands.move = async (direction, distance) => {
	const { goals: { GoalXZ } } = require('mineflayer-pathfinder');
	if (!(direction && (distance === undefined || distance > 0))) {
		info('Usage: .move <Direction> <distance?>. Direction = <north|south|east|west> distance > 0');
		return;
	}
	if (commands.tmp.botMoving) {
		warn('Cannot use this command while bot is moving.');
		return;
	}
	commands.tmp.botMoving = true;
	let x = 0;
	let z = 0;
	distance = distance || 1;
	switch (direction) {
	case 'north': z = -distance; break;
	case 'south': z = distance; break;
	case 'east': x = distance; break;
	case 'west': x = -distance; break;
	default:
		info('Usage: .move <Direction> <distance?>. Direction = <north|south|east|west> distance > 0');
		return;
	}
	let unit;
	if (distance === 1) unit = 'block';
	else unit = 'blocks';

	info(`Attempting to move ${direction} for ${distance} ${unit}`);
	const position = bot.player.entity?.position;
	await bot.pathfinder.goto(new GoalXZ(position.x + x, position.z + z)).catch((err) => {
		error(`Cannot move ${direction} for ${distance} ${unit}.\n${err}`);
	});
	success(`Successfully moved ${direction} for ${distance} ${unit}`);
	commands.tmp.botMoving = false;
};

commands.moveTo = async (x, z) => {
	if (isNaN(x) && isNaN(z)) {
		info('Usage: .moveto <X> <Y> <Z>');
		return;
	}
	if (commands.tmp.botMoving) {
		warn('Cannot use this command while bot is moving.');
		return;
	}
	commands.tmp.botMoving = true;
	const { goals: { GoalXZ } } = require('mineflayer-pathfinder');
	info(`Attempting to move to ${x}, ${z}`);
	bot.once('goal_reached', () => {
		success(`Moved to ${x}, ${z}`);
		commands.tmp.botMoving = false;
	});
	bot.pathfinder.goto(new GoalXZ(x, z))
		.catch((err) => {
			error(`Could not move to ${x}, ${z}.\n${err}`);
		});
};

commands.follow = async (player, range) => {
	if (commands.tmp.botMoving === false) {
		if (player && range > 1) {
			if (!bot.players[player]?.entity) {
				warn(`Player '${player}' does not exist`);
				return;
			}
			let unit;
			if (range === 1) unit = 'block';
			else unit = 'blocks';
			success(`Following ${player} with a range of ${range} ${unit}`);
			const { goals: { GoalNear } } = require('mineflayer-pathfinder');
			commands.tmp.botMoving = true;
			const playerPos = bot.players[player].entity?.position;
			while (commands.tmp.botMoving) {
				const dist = distance(bot.entity?.position, playerPos);
				if (dist > range) {
					const goal = new GoalNear(playerPos.x, playerPos.y, playerPos.z, range);
					await bot.pathfinder.goto(goal).catch((err) => {
						error('Could not follow the player.\n' + err);
					});
					info('followng');
				} else await sleep(100);
			}
		} else info('Usage: .follow <Player> <Range>. Range > 0');
	} else warn('Cannot use this command while bot is moving.');
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
	info('Not following anyone');
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
	const v = require('vec3');
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
			info(`Attacking ${player} with ${cps}CPS if MinReach(${minreach}) < distance < MaxReach(${reach})`);
			commands.tmp.attackInt = setInterval(() => {
				if (commands.tmp.botAttacking === true) botAttack(bot, reach, minreach, player);
				else clearInterval(commands.tmp.attackInt);
			}, 1000 / cps);
		} else info('Usage: .attack <Player> <CPS> <MaxReach> <MinReach>. MaxReach > MinReach (Duh), CPS > 0');
	} else info('Player is already attacking someone. Use ".stopattack"');
};

commands.stopattack = () => {
	if (commands.tmp.botAttacking === true) commands.tmp.botAttacking = false;
	info('Not attacking anyone');
};

commands.send = (msg) => {
	if (msg) bot.chat(msg);
	else info('Usage: .send <Message>');
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
	const items = [];
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
			info('There is no container opened right now');
			return;
		}
	} else if (id === 'inventory' || id === 0) window = false;
	else {
		// CHANGE THIS
		info('Usage: .inventory <ID: inventory|container|0|1> <Action?: click|move|drop|dropall> <Arg1?> <Arg2?>');
		return;
	}
	if (action === undefined && slot1 === undefined && slot2 === undefined) {
		let invv = '';
		process.stdout.write(ansi.color.dim);
		if (window) {
			const items = getItems(bot.currentWindow);
			for (let i = 0; i < getItems(bot.currentWindow).length; i++) {
				if (items[i].nbt?.value?.display?.value?.Name) {
					items[i].namee = items[i].nbt.value.display.value.Name.value.replace(/§./g, '');
				} else {
					items[i].namee = items[i].name + ':' + items[i].metadata;
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
					items[i].namee = items[i].nbt.value.display.value.Name.value.replace(/§./g, '');
				} else {
					items[i].namee = `${items[i].name}:${items[i].metadata}`;
				}
				invv = `${invv} ${items[i].hotbar} | #${items[i].slot}: x${items[i].count}  ${items[i].namee}  \n`;
			}
			safeWrite(`${invv}Selected slot: ${bot.quickBarSlot}`);
		}
		process.stdout.write(ansi.color.reset);
	} else if (action === 'click' && !isNaN(slot1)) {
		info(`Left clicking slot ${slot1} in window #${id}`);
		bot.clickWindow(slot1, 0, 0);
	} else if (action === 'move' && !isNaN(slot1) && !isNaN(slot2)) {
		info(`Moving item at slot ${slot1} to slot ${slot2} in window #${id}`);
		bot.clickWindow(slot1, 0, 0);
		bot.clickWindow(slot2, 0, 0);
	} else if (action === 'drop' && !isNaN(slot1)) {
		info(`Dropping item at slot ${slot1} in window #${id}`);
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
		info(`Dropping all items in window #${id}`);
		for (let i = 0; i < items.length; i++) {
			bot.clickWindow(items[i].slot, 0, 0);
			await sleep(slot1);
			bot.clickWindow(-999, 0, 0);
		}
	} else info('Usage: .inventory <ID: inventory|container|0|1> <Action?: click|move|drop|dropall> <Slot1?> <Slot2?>');
};

commands.useitem = async (sec) => {
	if (!sec) sec = 0.1;
	bot.activateItem();
	await sleep(sec * 1000);
	bot.deactivateItem();
	info(`Used an item for ${sec} seconds`);
};

commands.changeslot = (slot) => {
	if (!isNaN(slot) && slot > -1 && slot < 9) {
		bot.setQuickBarSlot(slot);
		info(`Changed slot to ${slot}`);
	} else info('Usage: .changeslot <Slot>. -1 < Slot < 9');
};

commands.optcmd = (inp, inps) => {
	const parseStr = require('./parsestr');
	inp = parseStr(inp);
	switch (inp[0].toLowerCase()) {
	case 'exit': commands.exit(); break;
	case 'reco': commands.reco(); break;
	case 'move': commands.move(inp[1], inp[2]); break;
	case 'moveto': commands.moveTo(inp[1], inp[2]); break;
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
	default: info('Command not found');
	}
};

commands.script = (pathToSrc) => {
	const fs = require('fs');
	if (!pathToSrc) {
		info('Usage: .script <Path> <Condition>');
		return;
	}
	fs.access(pathToSrc, fs.F_OK, (err) => {
		if (err) {
			info('Unable to access file. Does it exist?');
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
			info('Reading script');
			let inps;
			let inp;
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
			info('Reached end of script');
		});
	});
};

commands.lookAt = (who, reach, minreach, force) => {
	const v = require('vec3');
	if (who && reach > 0 && (minreach === undefined || reach > minreach)) {
		if (!minreach) minreach = reach;
		if (commands.tmp.botAttacking) {
			info('Bot is attacking someone. Use ".stopattack"');
			return;
		}
		if (commands.tmp.botLooking) {
			info('Bot is looking at someone. Use ".stoplookAt"');
			return;
		}
		commands.tmp.botLooking = true;
		if (force === 'yes' || force === 'y') {
			force = true;
		} else {
			force = false;
		}
		commands.tmp.lookInt = setInterval(() => {
			if (!commands.tmp.botLooking) clearInterval(commands.tmp.lookInt);
			if (bot.players[who]?.entity?.position) {
				const dist = distance(bot.players[who]?.entity?.position, bot.entity.position);
				if (dist < reach && dist > minreach) bot.lookAt(v(bot.players[who].entity.position.x, bot.players[who].entity.position.y + 1.585, bot.players[who].entity.position.z, force));
			}
		}, 100);
		let withForce = 'without';
		if (force) withForce = 'with';
		info(`Looking at ${who} if MinReach(${minreach}) < distance < MaxReach(${reach}) ${withForce} force`);
	} else info('Usage: .lookat <Player> <MaxReach> <MinReach> <Force?:yes|y|no|n>. MaxReach > MinReach (duh)');
};

commands.look = (a, b, c) => {
	if (a && isNaN(a)) {
		if (b === undefined) b = true;
		const dir = a;
		if (commands.LOOK(dir) === false) {
			info('Usage: .look <Direction?:north|south|east|west> <Yaw?> <Pitch?> <Force?>');
		} else info(`Looking ${dir}`);
	} else if (!isNaN(a) && !isNaN(b)) {
		info(`Set Yaw to ${a} and Pitch to ${b}`);
		if (c === undefined) c = true;
		bot.look(-(Number(a) + 180) / 57.296329454, -b / 57.296329454, c);
	} else info('Usage: .look <Direction?:north|south|east|west> <Yaw?> <Pitch?>');
};

commands.stoplook = () => {
	commands.tmp.botLooking = false;
	info('Not looking at anyone');
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
		info(`Set control state ${control} to ${state}`);
	} else if (control === 'clearall') {
		bot.clearControlStates();
		info('Cleared all control states');
	} else info('Usage: .control <Control: forward|back|left|right|jump|sneak> <State: true, false>');
};

/**
 * The commands.help function prints a help message to the console.
 *
 * @return Nothing.
 *
 */
commands.help = () => {
	info(`.exit           Exits the program
.reco           Reconnects to server
.move           Move in a certain direction in blocks
.moveto         Move to a specific set of coordinates
.forcemove      Move in a certain direction in seconds
.control        Set a control state
.follow         Follows a player
.unfollow       Stops following
.attack         Attacks a player
.stopattack     Stops attacking
.lookat         Look at a player
.stoplook       Stops looking
.look           Look in a certain direction
.send           Sends a message
.inventory      Inventory management
.useitem        Use a held item
.changeslot     Change held hotbar slot
.script         Run a script
.list           List players connected to the server and their ping
.help           Shows this help message`);
};

commands.list = () => {
	let out = '';
	for (const player in bot.players) {
		if (Object.hasOwnProperty.call(bot.players, player)) {
			const playerInfo = bot.players[player];
			out = `${out} ${playerInfo.username} [${playerInfo.ping}]`;
		}
	}
	info(`Player list:${out}`);
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
		commands.optcmd(inp, inps);
	} else {
		bot.chat(msg);
	}
};

module.exports = { commands, setBot, setbotMain, setChat };
