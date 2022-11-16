const { MCColor: { c2c } } = require('./ansi');
const sleep = require('./sleep');
const distance = require('./distance');
const owo = require('@zuzak/owo');
const readline = require('readline');
const parseStr = require('./parsestr');
const parseCoords = require('./parseCoords');
const parseVar = require('./parseVar');
const tab = require('./tabulate');
const { goals: { GoalXZ, GoalFollow } } = require('mineflayer-pathfinder');
const v = require('vec3');
let pRegistry;
let ChatMessage;
const { safeWrite, info, warn, error, success } = require('./log');
const { basename } = require('path');
const PACKAGE = require('PACKAGE');
const requireTOML = require('./requireTOML');
const path = require('path');
const configPath = require('./configPath')().path;

const playerIsMovingErr = 'Cannot use this command while player is moving.';

let chat;
const setChat = (swint) => {
	chat = swint;
};

let settings = {};
const setConfig = (conf) => {
	settings = conf;
};

const reservedCommandNames = [
	'optcmd',
	'cmd',
	'tmp',
	'tasks'
];

const scriptOnlyCommands = [
	'wait',
	'async',
	'print',
	'success',
	'info',
	'warn',
	'error'
];

const commandDescriptions = {
	exit: 'Disconnect from the server',
	reco: 'Reconnect to server',
	send: 'Send a message in chat',
	position: 'Show current position',
	distance: 'Show the distance between two points',
	list: 'List players connected to the server and their ping',
	blocks: 'Show blocks in a specified radius and filter',
	dig: 'Dig a block in a specific location if possible',
	stopdig: 'Stop digging',
	place: 'Place a block in a specific location if possible',
	move: 'Move the player in blocks',
	pathfind: 'Move to a specific set of coordinates',
	forcemove: 'Move the player in seconds',
	control: 'Set a control state of the player',
	follow: 'Follow a player',
	smartfollow: 'Same as follow but uses advanced pathfinding',
	unfollow: 'Stop following',
	attack: 'Attack a player',
	stopattack: 'Stop attacking',
	look: 'Look in a certain direction',
	lookat: 'Look at a player',
	stoplook: 'Stop looking',
	inventory: 'Inventory management',
	open: 'Open a container (chest)',
	changeslot: 'Change selected hotbar slot',
	useitem: 'Use a held item',
	set: 'Set a variable',
	unset: 'Delete a variable',
	value: 'Get value of a variable',
	variables: 'List all set variables',
	script: 'Run a script',
	version: 'Show package version',
	help: 'Shows this help message'
};

const nonVanillaCommands = [
	'smartfollow',
	'unfollow',
	'pathfind',
	'attack',
	'stopattack'
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

function toLowerCaseArr (arr) {
	const out = [];
	for (let i = 0; i < arr.length; i++) {
		out[i] = arr[i].toLowerCase();
	}
	return out;
}

const commands = { tmp: { variables: {} } };

commands.tmp.botMoving = false;
commands.tmp.botLooking = false;
commands.tmp.botAttacking = false;
commands.tmp.lookInt = false;

let script = { length: 0, msg: [] };
let bot;
// let botMain;

const setBot = (Bot) => {
	bot = Bot;
	pRegistry = require('prismarine-registry')(bot.version);
	ChatMessage = require('prismarine-chat')(pRegistry);
	// send a message when a window opens
	bot.on('windowOpen', () => {
		info('Container #1 opened\nUse ".inventory 1" to interact with it');
	});
};

const setbotMain = () => {
	// botMain = botmain;
};

function loadPlugins (plugins, before = false) {
	for (let i = 0; i < plugins.length; i++) {
		if (typeof plugins[i] !== 'string') {
			if (before === false) warn(`Invalid plugin path: '${plugins[i]}'`);
			continue;
		}
		if (plugins[i] === '') {
			continue;
		}

		let pluginName = basename(plugins[i]);

		try {
			require.resolve(plugins[i]);
		} catch (e) {
			if (before === false) warn(`Plugin '${pluginName}' not found.\nPath: '${plugins[i]}'`);
			continue;
		}

		try {
			const plugin = require(plugins[i]);
			if (typeof plugin.name === 'string') pluginName = plugin.name;
			if (before === true) {
				plugin.before?.({
					settings
				});
				continue;
			}
			plugin.load?.({
				playerIsMovingErr,
				sleep,
				move,
				commands,
				pRegistry,
				reservedCommandNames,
				commandDescriptions,
				settings,
				nonVanillaCommands,
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
			success(`Loaded plugin: '${pluginName}'`);

			plugin.main?.();
		} catch (e) {
			error(`An error occured with the plugin '${pluginName}'.\nIf this keeps happening you may need to remove the plugin`);
		}
	}
}

commands.tasks = () => {
	const tasksFile = 'tasks.toml';
	const tasks = requireTOML(path.join(configPath, tasksFile));
	const tasksKeys = Object.keys(tasks);
	const tasksValues = Object.values(tasks);
	for (let i = 0; i < tasksKeys.length; i++) {
		const key = tasksKeys[i];
		const value = tasksValues[i];
		const times = key.match(/^[^_]+/);
		if (!['on', 'once'].includes(times?.[0]) && (typeof value === 'string' && value !== undefined)) continue;
		bot[times](key.match(/(?<=_).+$/), () => {
			commands.optcmd(value.split(' '));
		});
	}
};

commands.exit = () => {
	bot.quit();
};

commands.reco = async () => {
	// info('Reconnecting', 1);
	// chat.removeAllListeners();
	// chat.pause();
	// bot.quit('reconnect');
	// await sleep(100);
	// // bot.removeAllListeners();
	// botMain();
	warn('Use .exit instead');
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

commands.position = () => {
	const pos = bot.entity.position;
	info(`Position: ${Number(pos.x.toFixed(3))}, ${Number(pos.y.toFixed(3))}, ${Number(pos.z.toFixed(3))}`);
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

commands.blocks = (range, count, filter) => {
	if ((isNaN(range) || range <= 0) || (isNaN(count) && count !== undefined)) {
		info('Usage: .blocks <Range> <Count?>. Range > 0');
		return;
	}

	const blocksCoords = bot.findBlocks({
		matching: (block) => {
			if (block && block.type !== pRegistry.blocksByName.air.id) {
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
	const completed = () => success(`Dug block at ${x}, ${y}, ${z}`);
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

commands.stopDig = () => {
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
	const sneakState = bot.getControlState('sneak');
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
				if (!blockRef) continue;
				if (blockRef.face === adjacentBlocks[i].supposedFace && distance(blockRef.position, adjacentBlocks[i].position) === 0) {
					WORKED = true;
				} else continue;
				bot.setControlState('sneak', true);
				await sleep(50);
				await bot.placeBlock(adjacentBlocks[i], blockID2Vec[blockRef.face]).catch((err) => {
					warn(`Impossible to place block from this angle.\n${err.message}`);
					WORKED = null;
				});
				return;
			}
		}
	)();
	await bot.look(yaw, pitch, true);
	bot.setControlState('sneak', sneakState);
	if (WORKED === false) warn('Impossible to place block from this angle');
	else if (WORKED === true) success(`Placed block at ${x}, ${y}, ${z}`);
	commands.tmp.botLooking = false;
};

commands.move = async (direction, distance) => {
	// ?
	if (!direction || (distance !== undefined && distance <= 0)) {
		info('Usage: .move <Direction:north|south|east|west> <distance?>. Distance > 0');
		return;
	}
	if (commands.tmp.botMoving === true) {
		warn(playerIsMovingErr);
		return;
	}
	distance = distance || 1;
	let x = 0;
	let z = 0;
	switch (direction) {
	case 'north': z = -distance; break;
	case 'south': z = distance; break;
	case 'east': x = distance; break;
	case 'west': x = -distance; break;
	default:
		info('Usage: .move <Direction:north|south|east|west> <distance?>. Distance > 0');
		return;
	}
	if (!Number.isInteger(distance)) {
		warn('Distance must be an integer');
		return;
	}
	commands.tmp.botMoving = true;
	let unit;
	if (distance === 1) unit = 'block';
	else unit = 'blocks';

	info(`Attempting to move ${direction} for ${distance} ${unit}`);
	const position = bot.entity?.position;
	// await bot.pathfinder.goto(new GoalXZ(position.x + x, position.z + z)).catch((err) => {
	// error(`Cannot move ${direction} for ${distance} ${unit}.\n${err}`);
	// });
	if (await move(position.x + x, position.z + z, 0, Infinity) === true) {
		success(`Moved ${direction} for ${distance} ${unit}`);
	} else {
		warn('Path was obstructed.\nStopped moving');
	}
	commands.tmp.botMoving = false;
};

commands.follow = async (player, range) => {
	if (commands.tmp.botMoving === true) {
		warn(playerIsMovingErr);
		return;
	}
	if (!player || !(range > 0)) {
		info('Usage: .follow <Player> <Range>. Range > 0');
		return;
	}
	if (!bot.players[player]) {
		warn(`Player '${player}' does not exist`);
		return;
	}
	commands.tmp.botMoving = true;
	let unit;
	if (range === 1) unit = 'block';
	else unit = 'blocks';
	success(`Following ${player} with a range of ${range} ${unit}`);
	const stopGoingForward = () => {
		if (bot.getControlState('forward') === true) {
			bot.setControlState('forward', false);
		}
	};
	const goForward = () => {
		if (bot.getControlState('forward') === false) {
			bot.setControlState('forward', true);
		}
	};
	const jump = async () => {
		if (bot.getControlState('jump') === false) {
			bot.setControlState('jump', true);
			await sleep(10);
			bot.setControlState('jump', false);
		}
	};
	const playerHeight = bot.players[player]?.entity?.height || 1.518;
	const sprintState = bot.getControlState('sprint');
	const jumpState = bot.getControlState('jump');
	let cooldown = 0;
	let playerPos = bot.players[player]?.entity?.position;
	let botPos = bot.entity?.position;
	bot.setControlState('sprint', true);

	let oldBotPos = Object.assign({}, botPos);
	while (commands.tmp.botMoving === true) {
		if ((Date.now() - cooldown) < 80) {
			cooldown = Date.now();
			await sleep(200);
			stopGoingForward();
			continue;
		} else cooldown = Date.now();
		playerPos = bot.players[player]?.entity?.position;
		botPos = bot.entity?.position;
		if (!playerPos || !botPos) {
			await sleep(150);
			stopGoingForward();
			continue;
		}
		const distXZ = distance({ x: botPos.x, z: botPos.z }, { x: playerPos.x, z: playerPos.z });
		// const distY = Math.abs(botPos.y - playerPos.y);
		if (distXZ <= range) {
			await sleep(150);
			stopGoingForward();
			continue;
		}
		// Makes the bot go in a straight line when possible
		const playerBlockPos = v(
			Math.floor(playerPos.x),
			botPos.y,
			Math.floor(playerPos.z)
		).offset(
			botPos.x - Math.floor(botPos.x),
			playerHeight,
			botPos.z - Math.floor(botPos.z)
		);
		bot.lookAt(playerBlockPos, true);
		goForward();
		if (distance({ x: oldBotPos.x + oldBotPos.z }, { x: botPos.x + botPos.z }) < 0.001) {
			jump();
		}
		oldBotPos = Object.assign({}, botPos);
		await sleep(80);
	}
	bot.setControlState('sprint', sprintState);
	bot.setControlState('jump', jumpState);
};

function look (direction) {
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
}

async function move (x, z, range, timeout) {
	if (bot === undefined) return;
	if (timeout === undefined) timeout = Infinity;
	if (range === undefined) range = 0;
	if (bot.getControlState('forward') === true) return;
	const yaw = bot.entity.yaw;
	const pitch = bot.entity.pitch;
	const sprintState = bot.getControlState('sprint');
	const goal = { x: Math.floor(x) + 0.5, z: Math.floor(z) + 0.5 };
	let dist = distance({ x: bot.entity.position.x, z: bot.entity.position.z }, goal) - 0.16;
	let oldDist = dist.valueOf() + 1;
	let int = 50;
	bot.setControlState('sprint', true);
	bot.setControlState('forward', true);
	bot.lookAt(v(x, bot.entity.position.y + bot.entity.height, z), true);
	await sleep(60);
	while (dist >= range && dist < oldDist) {
		oldDist = dist.valueOf();
		bot.lookAt(v(x, bot.entity.position.y + bot.entity.height, z), true);
		await sleep(int);
		dist = distance({ x: bot.entity.position.x, z: bot.entity.position.z }, goal) - 0.16;
		const a = dist * 100;
		if (a < 5) int = 5;
		else int = a;
	}
	bot.setControlState('sprint', sprintState);
	bot.setControlState('forward', false);
	bot.look(yaw, pitch, true);
	if (Math.floor(dist) + 0.5 <= range) {
		return true;
	} else {
		return false;
	}
}

commands.pathfind = async (x, z) => {
	if (isNaN(x) && isNaN(z)) {
		info('Usage: .pathfind <X> <Z>');
		return;
	}
	if (commands.tmp.botMoving) {
		warn(playerIsMovingErr);
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

commands.forceMove = async (direction, time) => {
	if ((direction === 'up' || direction === 'forward' || direction === 'back' || direction === 'left' || direction === 'right' || direction === 'sprint') && !isNaN(time)) {
		info(`Moving ${direction} for ${time} seconds`);
		if (direction === 'up') direction = 'jump';
		bot.setControlState(direction, true);
		await sleep(time * 1000);
		bot.setControlState(direction, false);
		success(`Moved ${direction} for ${time} seconds`);
	} else info('Usage: .forcemove <Dircetion:up|forward|back|left|right> <Time:Seconds>');
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

commands.smartFollow = async (player, range) => {
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
			let cooldown = 0;
			let goal;
			range = range - 0.55;
			while (commands.tmp.botMoving) {
				if ((Date.now() - cooldown) < 80) {
					cooldown = Date.now();
					await sleep(200);
					continue;
				} else cooldown = Date.now();
				if (!BotPlayer?.entity?.position) {
					await sleep(150);
					continue;
				}
				const dist = distance(bot.entity?.position, BotPlayer.entity.position) - 0.67;
				if (dist < range) {
					await sleep(150);
					continue;
				}
				goal = new GoalFollow(BotPlayer.entity, range);
				await bot.pathfinder.goto(goal).catch((err) => {
					error('Could not follow the player.\n' + err);
					goal = new GoalFollow(BotPlayer.entity, range);
				});
			}
		} else info('Usage: .smartfollow <Player> <Range>. Range > 0');
	} else warn(playerIsMovingErr);
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

commands.unFollow = () => {
	botUnfollow();
	success('Not following anyone');
};

/**
 * The botAttack function is used to attack a player.
 *
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
			const lookAt = v(bot.players[who].entity.position.x, bot.players[who].entity.position.y + bot.players[who].entity.height, bot.players[who].entity.position.z);
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

commands.stopAttack = () => {
	if (commands.tmp.botLooking === true && commands.tmp.botAttacking === false) {
		warn('Cannot use ".stopattack" because player is looking at someone\nConsider ".stoplook"');
		return;
	}
	commands.tmp.botAttacking = false;
	commands.tmp.botLooking = false;
	success('Not attacking anyone');
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
		}
		if (a < -90 || b < -90) {
			warn('Yaw or Pitch cannot be less than -90 deg');
			return;
		}
		if (c === undefined) c = true;
		await bot.look(-(Number(a) + 180) / 57.296329454, -b / 57.296329454, c);
		success(`Set Yaw to ${a} and Pitch to ${b}`);
	} else info('Usage: .look <Direction?:north|south|east|west> <Yaw?> <Pitch?>');
};

commands.lookAt = (who, reach, minreach, force) => {
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
				if (dist < reach && dist > minreach) bot.lookAt(v(bot.players[who].entity.position.x, bot.players[who].entity.position.y + bot.players[who].entity.height, bot.players[who].entity.position.z), force);
			}
		}, 100);
		let withForce = 'without';
		if (force) withForce = 'with';
		success(`Looking at ${who} if MinReach(${minreach}) < distance < MaxReach(${reach}) ${withForce} force`);
	} else info('Usage: .lookat <Player> <MaxReach> <MinReach> <Force?:yes|y|no|n>. MaxReach > MinReach (duh)');
};

commands.stopLook = () => {
	if (commands.tmp.botAttacking === true) {
		warn('Cannot use ".stoplook" because player is attacking someone\nConsider ".stopattack"');
		return;
	}
	commands.tmp.botLooking = false;
	info('Not looking at anyone');
};

const parseItemName = (item) => {
	let name = {};
	if (item?.nbt?.value?.display?.value?.Name) {
		name = item?.nbt.value.display.value.Name;
	} else if (item?.displayName) {
		name.value = item?.displayName;
	} else {
		name.value = item?.name || 'no_name';
	}

	let out = '';
	try {
		const parsedName = JSON.parse(name.value);
		out = c2c(new ChatMessage(parsedName).toMotd());
	} catch {
		out = c2c(name.value);
	}
	return out;
};

commands.inventory = async (id, action, ...slots) => {
	if (id !== 0 && id !== 1 && id !== 'inventory' && id !== 'container') {
		info('Usage: .inventory <ID:0|inventory|1|container> <Action?:click|move|drop|dropall|close>');
		return;
	}

	let isContainer = false;
	if (id === 'container' || id === 1) {
		isContainer = true;
	} else if (isContainer === false) {
		isContainer = false;
	}

	if (isContainer === true && !bot.currentWindow) {
		info('There is no container opened right now');
		return;
	}

	if (action === undefined) {
		let inventoryItems = {};
		if (isContainer === true) {
			if (!bot.currentWindow) {
				info('There is no container opened right now');
				return;
			}
			inventoryItems = getItems(bot.currentWindow);
		} else {
			inventoryItems = bot.inventory.items();
		}

		const a = (items) => {
			if (items.length < 1) {
				return 'Empty';
			}
			const make = (item, itemName, d = '') => {
				let a = bot.inventory.inventoryStart;
				if (item.slot > bot.inventory.inventoryEnd) {
					a = -a;
				}

				let hotBarNum = a - (bot.inventory.inventoryEnd - item.slot);
				if (isNaN(hotBarNum) || hotBarNum < 0) {
					hotBarNum = ' ';
				}
				out = `${out + d + hotBarNum} | #${item.slot}: x${item.count}  ${itemName}`;
			};
			let out = '';
			const itemm = items?.[0];

			const itemNamee = parseItemName(itemm);
			make(itemm, itemNamee);
			for (let i = 1; i < items.length; i++) {
				const item = items[i];
				const itemName = parseItemName(item);
				make(item, itemName, '\n');
			}
			return out;
		};

		let outStr = a(inventoryItems);
		if (isContainer === false) {
			outStr = `${outStr}\nSelected slot: ${bot.quickBarSlot}`;
		}
		info(outStr);
		return;
	}

	let inventoryStartOffset = 0;
	if (isContainer === false && bot.currentWindow?.inventoryEnd && bot.inventory?.inventoryEnd) {
		inventoryStartOffset = bot.currentWindow.inventoryEnd - bot.inventory.inventoryEnd;
	}

	if (action === 'close') {
		if (isContainer === true) {
			info(`Closing window #${id}`);
			bot.closeWindow(bot.currentWindow);
		} else {
			warn('Inventory cannot be closed. Only containers can');
		}
		return;
	}

	if (action === 'click' && !isNaN(slots[0])) {
		info(`Left clicking slot ${slots[0]} in window #${id}`);
		bot.clickWindow(slots[0], 0, 0);
		return;
	}
	if (action === 'move' && !isNaN(slots[0]) && !isNaN(slots[1])) {
		info(`Moving item at slot ${slots[0]} to slot ${slots[1]} in window #${id}`);
		await bot.clickWindow(inventoryStartOffset + slots[0], 0, 0);
		await sleep(10);
		await bot.clickWindow(inventoryStartOffset + slots[1], 0, 0);
		return;
	}
	if (action === 'drop' && !isNaN(slots[0])) {
		info(`Dropping item at slot ${slots[0]} in window #${id}`);
		await bot.clickWindow(inventoryStartOffset + slots[0], 0, 0);
		await sleep(10);
		await bot.clickWindow(-999, 0, 0);
		return;
	}
	if (action === 'dropall') {
		let items;
		if (isContainer === true) {
			items = getItems(bot.currentWindow, bot.inventory.inventoryEnd);
		} else {
			items = bot.inventory.items();
		}
		info(`Dropping all items in window #${id}`);
		for (let i = 0; i < items.length; i++) {
			await bot.clickWindow(inventoryStartOffset + items[i].slot, 0, 0);
			await sleep(10);
			await bot.clickWindow(-999, 0, 0);
		}
		return;
	}
	info('Usage: .inventory <ID:0|inventory|1|container> <Action?:click|move|drop|dropall>');
};

commands.open = async (x, y, z) => {
	if (isNaN(x) || isNaN(y) || isNaN(z)) {
		info('Usage: .open <X> <Y> <Z>');
		return;
	}
	if (commands.tmp.botLooking === true) {
		warn('Cannot use this command while player is attacking/looking at something.');
		return;
	}
	const blockPos = v(x, y, z);
	const block = bot.blockAt(blockPos);
	info('Attempting to open container');
	await bot.openContainer(block)
		.then(() => {
			success('Opened the container');
		})
		.catch((err) => {
			error(err.message);
		});
};

commands.changeSlot = (slot) => {
	if (!isNaN(slot) && slot > -1 && slot < 9) {
		bot.setQuickBarSlot(slot);
		info(`Changed slot to ${slot}`);
	} else info('Usage: .changeslot <Slot>. -1 < Slot < 9');
};

commands.useitem = async (sec) => {
	if (!sec) sec = 0.1;
	bot.activateItem();
	await sleep(sec * 1000);
	bot.deactivateItem();
	success(`Used an item for ${sec} seconds`);
};

commands.set = (key, value) => {
	if (key === undefined) {
		info('Usage: .set <Key> <Value>');
		return;
	}
	commands.tmp.variables[key] = value;
	success(`Set %${key}% to ${value}`);
};

commands.unset = (key) => {
	delete commands.tmp.variables[key];
	success(`Deleted %${key}%`);
};

commands.value = (key) => {
	info(`${key}: ${commands.tmp.variables[key]}`);
};

commands.variables = () => {
	const values = Object.values(commands.tmp.variables);
	const keys = Object.keys(commands.tmp.variables);
	let out = '';
	if (keys[0] !== undefined) out = `${keys[0]}: ${values[0]}`;
	for (let i = 1; i < values.length; i++) {
		if (keys[i] === undefined) continue;
		out = `${out}\n${keys[i]}: ${values[i]}`;
	}
	info(`Values:\n${out}`);
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
				if (script.msg[i] === '') continue;
				if (script.msg[i].match(/(?<=^#)./)) continue;
				inps = [];
				inps[0] = c2c(script.msg[i], '&');
				if (script.msg[i].match(/(?<= ).+/)) inps[1] = script.msg[i].match(/(?<= ).+/)[0];
				inp = inps[0].split(' ');
				await commands.optcmd(inp, { type: 'script' });
			}
			script = { length: 0, msg: [] };
			await sleep(200);
			success('Reached end of script');
		});
	});
};

commands.version = () => {
	info(`${PACKAGE.name} version: ${PACKAGE.version}\nNode version: ${process.version}`);
};

commands.OwO = (...msg) => {
	let out = '';
	if (typeof msg === 'object') {
		out = msg[0];
		for (let i = 1; i < msg.length; i++) {
			out = `${out} ${msg[i]}`;
		}
	} else out = msg;
	if (out) bot.chat(owo(out));
	else info('Usage: .owo <Message>');
};

/**
 * The getItems function returns an array of non empty items from the window.slots
 * property.
 *
 * @param {object} window Used to Access the window object.
 * @return {array} An array of items from the window.
 *
 */
function getItems (window, gt, lt) {
	let p = 0;
	const items = [];
	for (let i = 0; i < window.slots.length; i++) {
		const item = window.slots[i];
		if (item) {
			if ((lt && item.slot < lt) || (gt && item.slot > gt)) {
				continue;
			}
			items[p] = item;
			p++;
		}
	}
	return items;
}

commands.wait = async (sec) => {
	await sleep(sec * 1000);
};

commands.async = async (...input) => {
	if (!input[0]) {
		warn('No command provided');
		return;
	}
	commands.optcmd(input, { type: 'script' });
};

commands.print = safeWrite;
commands.success = success;
commands.info = info;
commands.warn = warn;
commands.error = error;

commands.optcmd = async (inp, options) => {
	inp = parseStr(inp);
	let inputCommand = inp[0].toLowerCase();
	const commandKeys = Object.keys(commands);
	const aliasKeys = toLowerCaseArr(Object.keys(settings.settings.config.config.config.commands.commandAliases));
	const aliasValues = toLowerCaseArr(Object.values(settings.settings.config.config.config.commands.commandAliases));
	const indexOfAlias = aliasKeys.indexOf(inputCommand);
	let args = [];
	if (indexOfAlias !== -1) {
		const fullCommand = aliasValues[indexOfAlias].split(' ');
		inputCommand = fullCommand[0];
		// ??
		args = [...args, ...fullCommand.splice(1)];
	}
	args = [...args, ...inp.splice(1)];
	const indexOfCommand = toLowerCaseArr(commandKeys).indexOf(inputCommand);

	if (indexOfCommand === -1 || reservedCommandNames.includes(inputCommand)) {
		warn(`'${inputCommand}' is not a valid command`);
		return;
	}
	if (settings.settings.config.config.config.commands.enableNonVanillaCMD === false && nonVanillaCommands.includes(inputCommand)) {
		warn('This commands uses some non-vanilla features to work which may get you banned on some servers.\nYou can enable it in the configuration');
		return;
	}
	if (options?.type !== 'script' && scriptOnlyCommands.includes(inputCommand)) {
		warn('This command can only be used inside scripts');
		return;
	}
	const func = commands[commandKeys[indexOfCommand]];
	await func(...args);
};

/**
 * The commands.help function prints a help message to the console.
 *
 * @return Nothing.
 *
 */
commands.help = () => {
	const check = (cmd) => {
		if (reservedCommandNames.includes(cmd)) {
			return false;
		}
		return true;
	};
	let help = '';
	let i = 1;
	const commandNames = Object.keys(commands);
	for (let p = 0; p < i; p++) {
		const command = commandNames[p];
		if (check(command) === true) {
			help = '.' + tab(command, commandDescriptions[command], 14);
		} else i++;
	}
	for (; i < commandNames.length; i++) {
		const command = commandNames[i];
		if (check(command) === false) continue;
		help = `${help}\n.${tab(command, commandDescriptions[command.toLowerCase()], 14)}`;
	}
	info(help);
};

commands.cmd = async (msg) => {
	if (msg === '') {
		chat.prompt();
		return;
	}

	if (msg.match(/(?<=^\.)./)) {
		let command = msg.match(/(?<=^\.).+/)[0];
		command = parseCoords(command, bot.entity.position, 3);
		command = parseVar(command, commands.tmp.variables, '%', '%');
		// const inps = [];
		// inps[0] = tmp;
		// if (tmp.match(/(?<= ).+/)) inps[1] = tmp.match(/(?<= ).+/)[0];
		// const inp = inps[0].match(/[^ ]+/g);
		const inp = command.match(/[^ ]+/g);
		commands.optcmd(inp);
		return;
	}
	bot.chat(msg);
};

module.exports = { commands, setBot, setbotMain, setChat, setConfig, loadPlugins };
