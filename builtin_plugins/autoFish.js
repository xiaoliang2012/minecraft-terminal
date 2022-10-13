// To fish we have to give bot the fishing rod and teleport bot to the water
// /give fisherman fishing_rod 1
// /teleport fisherman ~ ~ ~

// To eat we have to apply hunger first
// /effect fisherman minecraft:hunger 1 255
let mcterm;
const load = (A) => {
	mcterm = A;
};

const main = () => {
	const fish = async () => {
		if (nowFishing === true) {
			mcterm.warn('Already fishing');
			return;
		}
		try {
			await mcterm.bot.equip(mcterm.registry.itemsByName.fishing_rod.id, 'hand');
		} catch {
			mcterm.warn('I don\'t have any fishing rods!');
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

	mcterm.info('Added \'.fish\', \'.stopfish\' and \'.caughtfish\' commands');

	let caughtFish = 0;
	const onCollect = (player, entity) => {
		if (entity.kind === 'Drops' && player === mcterm.bot.entity) {
			mcterm.bot.removeListener('playerCollect', onCollect);
			caughtFish++;
			mcterm.success(`Caught a fish! I've caught ${caughtFish} fish so far`);
			fish();
		}
	};

	let nowFishing = false;

	mcterm.commands.caughtFish = () => {
		mcterm.info(`Caught fish: ${caughtFish}`);
	};

	mcterm.commands.fish = async () => {
		mcterm.info('Started fishing');
		await fish();
	};

	mcterm.commands.stopfish = () => {
		mcterm.success('Stopped fishing');
		if (nowFishing === false) return;
		mcterm.bot.removeListener('playerCollect', onCollect);

		mcterm.bot.activateItem();
	};
};

module.exports = { load, main, name: 'Auto Fish' };
