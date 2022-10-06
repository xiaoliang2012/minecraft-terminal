// To fish we have to give bot the fishing rod and teleport bot to the water
// /give fisherman fishing_rod 1
// /teleport fisherman ~ ~ ~

// To eat we have to apply hunger first
// /effect fisherman minecraft:hunger 1 255
let mcData;
let mcterm;
const load = (A) => {
	mcterm = A;
	mcterm.bot.on('inject_allowed', () => {
		mcData = require('minecraft-data')(mcterm.bot.version);
	});
};

const main = () => {
	mcterm.info('Added \'.fish\', \'.stopfish\' and \'.caughtfish\' commands');

	let caughtFish = 0;
	const onCollect = (player, entity) => {
		if (entity.kind === 'Drops' && player === mcterm.bot.entity) {
			mcterm.bot.removeListener('playerCollect', onCollect);
			caughtFish++;
			mcterm.commands.fish();
		}
	};

	let nowFishing = false;

	mcterm.commands.caughtFish = () => {
		mcterm.info(`Caught fish: ${caughtFish}`);
	};

	mcterm.commands.fish = async () => {
		mcterm.info('Started fishing');
		try {
			await mcterm.bot.equip(mcData.itemsByName.fishing_rod.id, 'hand');
		} catch (err) {
			mcterm.error(err.message);
			return;
		}

		nowFishing = true;
		mcterm.bot.on('playerCollect', onCollect);

		try {
			await mcterm.bot.fish();
		} catch (err) {
			mcterm.error(err.message);
		}
		nowFishing = false;
	};

	mcterm.commands.stopfish = () => {
		mcterm.info('Stopped fishing');
		mcterm.bot.removeListener('playerCollect', onCollect);

		if (nowFishing) {
			mcterm.bot.activateItem();
		}
	};
};

module.exports = { load, main, name: 'Auto Fish' };
