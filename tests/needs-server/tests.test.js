/* eslint-env jest */
const mcUtils = require('../../lib/mineflayer-utils');
const distance = require('../../lib/distance');
const { EventEmitter } = require('events');
const serverUtils = require('./serverUtils');
const sleep = require('../../lib/sleep');

jest.setTimeout(30 * 1000);

let bot = new EventEmitter();

beforeAll(async () => {
	bot = await serverUtils.beforeEverything();

	await sleep(2000);
	mcUtils.setBot(bot);
}, 30 * 1000);

describe('mcUtils', () => {
	test('mcUtils.move', async () => {
		const xOffset = 10;
		const zOffset = 10;

		const oldPos = bot.entity.position;
		await mcUtils.move(bot.entity.position.x + xOffset, bot.entity.position.z + zOffset);
		const supposedDist = distance(oldPos, oldPos.offset(xOffset, 0, zOffset));
		const dist = distance(oldPos, bot.entity.position);
		const errorRange = 5;

		expect(dist < (supposedDist + errorRange) && dist > (supposedDist - errorRange)).toBeTruthy();
	});
});

afterAll(async () => {
	await serverUtils.waitForBotToSpawn(bot);
	bot.chat('/stop');
	bot.quit();
	await serverUtils.waitForBotToEnd(bot);
}, 30 * 1000);
