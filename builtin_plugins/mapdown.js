const sleep = require('../lib/sleep');
const mapjs = require('../lib/map');

const mapOutputFolder = './maps';
const mapOutputFile = (id) => {
	return `map_${id}`;
};

let mcterm;

const load = (A) => {
	mcterm = A;
};

const main = () => {
	mcterm.commands.getMap = async (timeout) => {
		if (typeof timeout !== 'number') timeout = 1;

		mcterm.info(`Listening for new maps. ${timeout} sec timeout`);

		let done = false;
		const onMap = (map) => {
			const { writeFileSync, readdirSync, mkdirSync, lstatSync, rmSync } = require('fs');
			const { join } = require('path');
			const pngImage = mapjs(map.data);
			try {
				const stats = lstatSync(mapOutputFolder);

				if (!stats.isDirectory()) {
					rmSync(mapOutputFolder);
					mkdirSync(mapOutputFolder, { recursive: true });
				}
			} catch {
				mkdirSync(mapOutputFolder, { recursive: true });
			}

			let id = 0;
			const files = readdirSync(mapOutputFolder);
			for (let i = 0; i < files.length; i++) {
				if (files[i] === mapOutputFile(id)) id++;
				else i = files.length;
			}
			const mapOutputFullPath = join(mapOutputFolder, mapOutputFile(id));
			writeFileSync(mapOutputFullPath, pngImage);
			done = true;
			mcterm.success(`Map saved as '${mapOutputFullPath}'`);
			mcterm.bot._client.off('map', onMap);
		};
		mcterm.bot._client.once('map', onMap);
		await sleep(timeout * 1000);
		if (done === false) mcterm.info(`Map download timed out after ${timeout} sec`);
	};
};

module.exports = { load, main, name: 'Map Downloader' };
