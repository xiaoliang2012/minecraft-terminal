const ansi = require('./ansi');
const sleep = require('./sleep');
const distance = require('./distance');
const readline = require('readline');
const parseStr = require('./parsestr');
const parseCoords = require('./parseCoords');
const { goals: { GoalXZ, GoalFollow } } = require('mineflayer-pathfinder');
const v = require('vec3');
let mcData;
const { safeWrite, info, warn, error, success } = require('./mccinfo');
const { basename } = require('path');

let chat;
const setChat = (swint) => {
	chat = swint;
};

const reservedCommandNames = [
	'optcmd',
	'cmd',
	'tmp'
];

const blockID2Face = [
	'down',
	'up',
	'south',
	'north',
	'east',
	'west'
];

function reverseFaceID (ID) {
	if (ID % 2 === 0) return ID + 1;
	else return ID - 1;
}

const face2BlockID = {
	down: 0,
	up: 1,
	south: 2,
	north: 3,
	east: 4,
	west: 5
};

const blockFace2Vec = {
	// eslint-disable-next-line quote-props
	west: v(1, 0, 0),
	up: v(0, 1, 0),
	north: v(0, 0, 1),
	east: v(-1, 0, 0),
	down: v(0, -1, 0),
	south: v(0, 0, -1)
};

const blockID2Vec = [
	v(0, -1, 0),
	v(0, 1, 0),
	v(0, 0, -1),
	v(0, 0, 1),
	v(-1, 0, 0),
	v(1, 0, 0)
];

const commands = { tmp: {} };

commands.tmp.botMoving = false;
commands.tmp.botLooking = false;
commands.tmp.botAttacking = false;
commands.tmp.lookInt = false;

let script = { length: 0, msg: [] };
let bot;
let botMain;

const setBot = (Bot) => {
	bot = Bot;
	mcData = require('minecraft-data')(bot.version);
};

const setbotMain = (botmain) => {
	botMain = botmain;
};

const loadPlugins = (plugins) => {
	for (let i = 0; i < plugins.length; i++) {
		if (typeof plugins[i] !== 'string') {
			warn(`Invalid plugin path: '${plugins[i]}'`);
			return;
		}
		if (plugins[i] === '') {
			return;
		}

		let pluginName = basename(plugins[i]);

		try {
			require.resolve(plugins[i]);
		} catch (e) {
			warn(`Plugin '${pluginName}' not found.\nPath: '${plugins[i]}'`);
			return;
		}

		try {
			const plugin = require(plugins[i]);
			pluginName = plugin.name || pluginName;
			plugin.load({
				commands,
				mcData,
				reservedCommandNames,
				vec: v,
				blockFace2Vec,
				blockID2Face,
				parseCoords,
				parseStr,
				distance,
				bot,
				safeWrite,
				info,
				warn,
				error,
				success
			});
			success(`Successfully loaded the '${pluginName}'`);

			plugin.main();
		} catch (e) {
			error(`An error occured with the plugin '${pluginName}'.\nIf this keeps happening you may need to remove the plugin`);
			warn('It\'s recommended to stop playing when errors occur.\nAs the program may become unstable');
		}
	}
};

commands.exit = () => {
	bot.quit();
};

commands.reco = async () => {
	info('Reconnecting', 1);
	chat.removeAllListeners();
	chat.pause();
	bot.quit('reconnect');
	await sleep(100);
	bot.removeAllListeners();
	botMain();
};

commands.forcemove = async (direction, time) => {
	if ((direction === 'up' || direction === 'forward' || direction === 'back' || direction === 'left' || direction === 'right' || direction === 'sprint') && !isNaN(time)) {
		info(`Moving ${direction} for ${time} seconds`);
		if (direction === 'up') direction = 'jump';
		bot.setControlState(direction, true);
		await sleep(time * 1000);
		bot.setControlState(direction, false);
		success(`Moved ${direction} for ${time} seconds`);
	} else info('Usage: .forcemove <Dircetion:up|forward|back|left|right> <Time:Seconds>');
};

const look = (direction) => {
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
	if (!(direction && (distance === undefined || distance > 0))) {
		info('Usage: .move <Direction> <distance?>. Direction = <north|south|east|west> distance > 0');
		return;
	}
	if (commands.tmp.botMoving === true) {
		warn('Cannot use this command while player is moving.');
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
	const position = bot.entity?.position;
	await bot.pathfinder.goto(new GoalXZ(position.x + x, position.z + z)).catch((err) => {
		error(`Cannot move ${direction} for ${distance} ${unit}.\n${err}`);
	});
	success(`Successfully moved ${direction} for ${distance} ${unit}`);
	commands.tmp.botMoving = false;
};

commands.moveto = async (x, z) => {
	if (isNaN(x) && isNaN(z)) {
		info('Usage: .moveto <X> <Z>');
		return;
	}
	if (commands.tmp.botMoving) {
		warn('Cannot use this command while player is moving.');
		return;
	}
	commands.tmp.botMoving = true;
	info(`Attempting to move to ${x}, ${z}`);
	await bot.pathfinder.goto(new GoalXZ(x, z))
		.catch((err) => {
			error(`Could not move to ${x}, ${z}.\n${err}`);
			commands.tmp.botMoving = false;
		});
	success(`Moved to ${x}, ${z}`);
	commands.tmp.botMoving = false;
};

commands.follow = async (player, range) => {
	if (commands.tmp.botMoving === false) {
		if (player && range > 0) {
			if (!bot.players[player]) {
				warn(`Player '${player}' does not exist`);
				return;
			}
			let unit;
			if (range === 1) unit = 'block';
			else unit = 'blocks';
			success(`Following ${player} with a range of ${range} ${unit}`);
			commands.tmp.botMoving = true;
			const BotPlayer = bot.players[player];
			let goal;
			let notFound = false;
			if (BotPlayer?.position) {
				goal = new GoalFollow(BotPlayer.entity, range);
				goal.rangeSq = range;
			}
			while (commands.tmp.botMoving) {
				if (!BotPlayer.entity?.position) {
					notFound = true;
					await sleep(100);
					continue;
				}
				if (notFound || goal === undefined) {
					notFound = false;
					goal = new GoalFollow(BotPlayer.entity, range);
					goal.rangeSq = range;
				}
				const dist = distance(bot.entity?.position, BotPlayer.entity.position);
				if (dist < range) {
					await sleep(100);
					continue;
				}
				await bot.pathfinder.goto(goal).catch((err) => {
					error('Could not follow the player.\n' + err);
				});
			}
		} else info('Usage: .follow <Player> <Range>. Range > 0');
	} else warn('Cannot use this command while player is moving.');
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
	success('Not following anyone');
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
function botAttack (reach, minreach, who) {
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
	if (commands.tmp.botAttacking) {
		warn('Player is already attacking someone. Use ".stopattack"');
		return;
	}
	if (commands.tmp.botLooking) {
		warn('Player is looking at someone. Use ".stoplook"');
		return;
	}
	if (!player || isNaN(cps) || isNaN(reach) || isNaN(minreach) || cps <= 0 || reach <= 0 || reach < minreach) {
		info('Usage: .attack <Player> <CPS> <MaxReach> <MinReach>. MaxReach > MinReach (Duh), CPS > 0');
		return;
	}
	commands.tmp.botLooking = true;
	commands.tmp.botAttacking = true;
	success(`Attacking ${player} with ${cps}CPS if MinReach(${minreach}) < distance < MaxReach(${reach})`);
	commands.tmp.attackInt = setInterval(() => {
		if (commands.tmp.botAttacking === true) botAttack(reach, minreach, player);
		else clearInterval(commands.tmp.attackInt);
	}, 1000 / cps);
};

commands.stopattack = () => {
	if (commands.tmp.botLooking === true && commands.tmp.botAttacking === false) {
		warn('Cannot use ".stopattack" because player is looking at someone\nConsider ".stoplook"');
		return;
	}
	commands.tmp.botAttacking = false;
	commands.tmp.botLooking = false;
	success('Not attacking anyone');
};

commands.send = (...msg) => {
	let out = '';
	if (typeof msg === 'object') {
		out = msg[0];
		for (let i = 1; i < msg.length; i++) {
			out = `${out} ${msg[i]}`;
		}
	} else out = msg;
	if (out) bot.chat(out);
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
	success(`Used an item for ${sec} seconds`);
};

commands.changeslot = (slot) => {
	if (!isNaN(slot) && slot > -1 && slot < 9) {
		bot.setQuickBarSlot(slot);
		info(`Changed slot to ${slot}`);
	} else info('Usage: .changeslot <Slot>. -1 < Slot < 9');
};

commands.blocks = (range, count, filter) => {
	if ((isNaN(range) || range <= 0) || (isNaN(count) && count !== undefined)) {
		info('Usage: .blocks <Range> <Count?>. Range > 0');
		return;
	}

	const blocksCoords = bot.findBlocks({
		matching: (block) => {
			if (block && block.type !== mcData.blocksByName.air.id) {
				return block;
			}
		},
		maxDistance: range,
		count: count || Infinity
	});
	const blocks = [];
	for (let i = 0; i < blocksCoords.length; i++) {
		blocks[i] = bot.blockAt(blocksCoords[i]);
	}
	let ready = '';
	let blockCount = 0;
	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		const regex = new RegExp(filter, 'i');
		if (!block.displayName?.match(regex)) continue;
		ready = `${ready}${block.position}  ${block.displayName}: ${block.diggable}\n`;
		blockCount++;
	}
	info(`${ready}Blocks: ${blockCount}`);
};

commands.dig = async (x, y, z) => {
	if (!(!isNaN(x) && !isNaN(y) && !isNaN(z))) {
		info('Usage: .dig <X> <Y> <Z>');
		return;
	}
	const block = bot.blockAt(v(x, y, z));
	if (block.type === 0) {
		warn('Block doesn\'t exist');
		return;
	}
	const completed = () => success(`Successfully dug block at ${x}, ${y}, ${z}`);
	bot.once('diggingCompleted', completed);
	await bot.dig(block, true, 'raycast').catch((err) => {
		let moreInfo = '';
		if (err.message === 'Block not in view') moreInfo = '.\nTry moving closer to the block';
		if (err.message === 'dig was called with an undefined or null block') moreInfo = '.\nThat means the block doesn\'t exist';
		warn(`Bot cannot dig block at ${x}, ${y}, ${z}.\n${err.message + moreInfo}`);
		bot.off('diggingCompleted', completed);
	});

	bot.off('diggingCompleted', completed);
};

commands.stopdig = () => {
	bot.stopDigging();
	success('Stopped digging');
};

commands.place = async (x, y, z) => {
	if (isNaN(x) || isNaN(y) || isNaN(z)) {
		info('Usage: .place <X> <Y> <Z>');
		return;
	}
	if (commands.tmp.botLooking === true) {
		warn('Cannot use this command while player is attacking/looking at something.');
		return;
	}
	const yaw = bot.entity.yaw;
	const pitch = bot.entity.pitch;
	const blockAt = v(x, y, z);
	const block = bot.blockAt(blockAt);
	if (block?.type !== 0) {
		warn(`There's already a '${block.displayName}' block in there!`);
		return;
	}
	commands.tmp.botLooking = true;
	let WORKED;
	await (
		async () => {
			info(`Attempting to place a block at ${x}, ${y}, ${z}`);
			const adjacentBlocks = [];
			for (let i = 0; i < 6; i++) {
				const face = blockID2Face[i];
				const offset = blockFace2Vec[face];
				const adjBlockPos = blockAt.offset(offset.x, offset.y, offset.z);
				const adjBlock = bot.blockAt(adjBlockPos);
				if (adjBlock.type === 0) {
					continue;
				}
				adjacentBlocks[i] = adjBlock;
				adjacentBlocks[i].supposedFace = reverseFaceID(face2BlockID[face]);
			}
			if (adjacentBlocks.length === 0) {
				warn('There should be a block right next to where you would place the block');
				return;
			}
			WORKED = false;
			for (let i = 0; i < adjacentBlocks.length; i++) {
				if (adjacentBlocks[i] === undefined) continue;
				await bot.lookAt(adjacentBlocks[i].position.offset(0.5, 0.5, 0.5), true);
				await sleep(200);
				const blockRef = bot.blockAtCursor(4);
				if (blockRef.face === adjacentBlocks[i].supposedFace && distance(blockRef.position, adjacentBlocks[i].position) === 0) {
					WORKED = true;
				} else continue;
				await bot.placeBlock(adjacentBlocks[i], blockID2Vec[blockRef.face]).catch((err) => {
					warn(`Impossible to place block from this angle.\n${err.message}`);
					WORKED = null;
				});
				return;
			}
		}
	)();
	await bot.look(yaw, pitch, true);
	if (WORKED === false) warn('Impossible to place block from this angle');
	else if (WORKED === true) success(`Successfully placed a block at ${x}, ${y}, ${z}`);
	commands.tmp.botLooking = false;
};

commands.distance = (x1, y1, z1, x2, y2, z2) => {
	if (!(!isNaN(x1) && !isNaN(y1) && !isNaN(z1) && !isNaN(x2) && !isNaN(y2) && !isNaN(z2))) {
		info('Usage: .distance <X1> <Y1> <Z1> <X2> <Y2> <Z2>');
		return;
	}
	const point1 = v(x1, y1, z1);
	const point2 = v(x2, y2, z2);
	info(`Distance: ${Number(distance(point1, point2).toFixed(3))}`);
};

commands.position = () => {
	const pos = bot.entity.position;
	info(`Position: ${Number(pos.x.toFixed(3))}, ${Number(pos.y.toFixed(3))}, ${Number(pos.z.toFixed(3))}`);
};

commands.optcmd = async (inp) => {
	inp = parseStr(inp);
	const commandKeys = Object.keys(commands);
	const command = inp[0].toLowerCase();
	const args = inp.splice(1);
	if (commandKeys.includes(command) && !reservedCommandNames.includes(command)) await commands[command](...args);
	else info('Command not found');
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
				else await commands.optcmd(inp);
			}
			script = { length: 0, msg: [] };
			await sleep(200);
			success('Reached end of script');
		});
	});
};

commands.lookat = (who, reach, minreach, force) => {
	if (who && reach > 0 && (minreach === undefined || reach > minreach)) {
		if (minreach === undefined) minreach = reach;
		if (commands.tmp.botAttacking) {
			warn('Player is attacking someone. Use ".stopattack"');
			return;
		}
		if (commands.tmp.botLooking) {
			warn('Player is already looking at someone. Use ".stoplook"');
			return;
		}
		commands.tmp.botLooking = true;
		if (force === 'yes' || force === 'y') force = true;
		else force = false;
		commands.tmp.lookInt = setInterval(() => {
			if (!commands.tmp.botLooking) clearInterval(commands.tmp.lookInt);
			if (bot.players[who]?.entity?.position) {
				const dist = distance(bot.players[who]?.entity?.position, bot.entity.position);
				if (dist < reach && dist > minreach) bot.lookAt(v(bot.players[who].entity.position.x, bot.players[who].entity.position.y + 1.585, bot.players[who].entity.position.z), force);
			}
		}, 100);
		let withForce = 'without';
		if (force) withForce = 'with';
		success(`Looking at ${who} if MinReach(${minreach}) < distance < MaxReach(${reach}) ${withForce} force`);
	} else info('Usage: .lookat <Player> <MaxReach> <MinReach> <Force?:yes|y|no|n>. MaxReach > MinReach (duh)');
};

commands.look = async (a, b, c) => {
	if (a && isNaN(a)) {
		if (b === undefined) b = true;
		const dir = a;
		if (look(dir) === false) {
			info('Usage: .look <Direction?:north|south|east|west> <Yaw?> <Pitch?> <Force?>');
		} else success(`Looking ${dir}`);
	} else if (!isNaN(a) && !isNaN(b)) {
		if (a > 90 || b > 90) {
			warn('Yaw or Pitch cannot be more than 90 deg');
			return;
		};
		if (a < -90 || b < -90) {
			warn('Yaw or Pitch cannot be less than -90 deg');
			return;
		};
		if (c === undefined) c = true;
		await bot.look(-(Number(a) + 180) / 57.296329454, -b / 57.296329454, c);
		success(`Set Yaw to ${a} and Pitch to ${b}`);
	} else info('Usage: .look <Direction?:north|south|east|west> <Yaw?> <Pitch?>');
};

commands.stoplook = () => {
	if (commands.tmp.botAttacking === true) {
		warn('Cannot use ".stoplook" because player is attacking someone\nConsider ".stopattack"');
		return;
	}
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
		success(`Set control state ${control} to ${state}`);
	} else if (control === 'clearall') {
		bot.clearControlStates();
		success('Cleared all control states');
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
.position       Show the current player position
.distance       Show the distance between two points
.blocks         Show all blocks in a specified radius
.dig            Dig a block in the specified coordinates
.place          Place a block in a specific location if possible
.stopdig        Stop digging
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

commands.cmd = async (msg) => {
	if (msg === '') {
		chat.prompt();
		return;
	}

	if (msg.match(/(?<=^\.)./)) {
		const tmp = parseCoords(msg.match(/(?<=^\.).+/)[0], bot.entity.position, 3);
		const inps = [];
		inps[0] = tmp;
		if (tmp.match(/(?<= ).+/)) inps[1] = tmp.match(/(?<= ).+/)[0];
		const inp = inps[0].match(/[^ ]+/g);
		commands.optcmd(inp);
	} else {
		bot.chat(msg);
	}
};

module.exports = { commands, setBot, setbotMain, setChat, loadPlugins };
