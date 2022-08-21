const ansi = require('./ansi');
const sleep = require('./sleep');
const distance = require('./distance');
const readline = require('readline');
const { safeWrite, info } = require('./mccinfo');

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
	info('Reconnecting');
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

commands.move = (direction, distance) => {
	if (direction && (distance === undefined || distance > 0)) {
		if (!bot.pathfinder.isMoving() || !commands.tmp.botMoving) {
			let unit;
			if (distance === 1) unit = 'block';
			else unit = 'blocks';
			if (commands.LOOK(direction) === false) {
				info('Usage: .move <Direction> <distance?>. Direction = <north|south|east|west> distance > 0');
				return;
			} else info(`Attempting to move ${direction} for ${distance} ${unit}`);
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
	} else info('Usage: .move <Direction> <distance?>. Direction = <north|south|east|west> distance > 0');
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
	const { goals } = require('mineflayer-pathfinder');
	let time;
	// var tarposition
	let goal;
	// initialize target position
	if (who) commands.tmp.botMoving = true;
	else commands.tmp.botMoving = false;
	// eslint-disable-next-line no-unmodified-loop-condition
	while (commands.tmp.botMoving === true) {
		if (bot.players[who]?.entity?.position) {
			if (distance(bot.players[who]?.entity?.position, bot.entity.position) > RANGE_GOAL) {
				try {
					time = Date.now();
					goal = new goals.GoalNear(bot.players[who].entity.position.x, bot.players[who].entity.position.y, bot.players[who].entity.position.z, RANGE_GOAL);
					await bot.pathfinder.goto(goal);
				} catch (error) {
					info(`${error.message} Retrying in 0.2 seconds`);
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
			info(`Following ${player} with a range of ${range} ${unit}`);
		} else info('Usage: .follow <Player> <Range>. Range > 1');
	} else info('Player is already following someone. Use ".unfollow"');
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
	info(`[MCC]
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
