const random = require('../../lib/getRandomArbitrary');

const mineflayer = require('mineflayer');
const { EventEmitter } = require('events');

const serverVersion = '1.8.9';
const serverPort = 12345;
const serverHost = '0.0.0.0';
const username = 'testBot_' + random(0, 9999);

let ended = false;
async function waitForBotToEnd (bot) {
	if (!bot || ended === true) {
		return;
	}
	ended = true;
	return await new Promise((resolve) => bot.once('end', resolve));
};

let spawned = false;
async function waitForBotToSpawn (bot) {
	if (!bot || spawned === true) {
		return;
	}
	spawned = true;
	return await new Promise((resolve) => bot.once('spawn', resolve));
};

let bot = new EventEmitter();

async function beforeEverything () {
	bot = mineflayer.createBot({
		host: serverHost,
		port: serverPort,
		username,
		version: serverVersion
	});
	bot.once('error', () => {
		process.exit(1);
	});

	await waitForBotToSpawn(bot);
	return bot;
};

module.exports = {
	waitForBotToEnd,
	waitForBotToSpawn,
	beforeEverything
};
