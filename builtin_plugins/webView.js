const mineflayerViewer = require('prismarine-viewer').mineflayer;
const logger = require('logger');
const ansi = require('easy-ansi');

const webServerPort = 3000;

const load = (A) => {
	A.bot.once('spawn', () => {
		mineflayerViewer(A.bot, { port: webServerPort, version: A.bot.version }); // Start the viewing server on port 3000
		logger.info(`Web viewer running on port ${logger.warn.color + ansi.color.italic}https://localhost:${webServerPort}%COLOR%`);

		// Draw the path followed by the bot
		const path = [A.bot.entity.position.clone()];
		A.bot.on('move', () => {
			if (path[path.length - 1].distanceTo(A.bot.entity.position) > 1) {
				path.push(A.bot.entity.position.clone());
				A.bot.viewer.drawLine('path', path);
			}
		});
	});
};

module.exports = { load, name: 'Web View' };
