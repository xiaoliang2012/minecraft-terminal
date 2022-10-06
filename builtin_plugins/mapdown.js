const sleep = require('../lib/sleep');
const mapjs = require('../lib/map');

const mapOutputFolder = './maps';
const mapOutputFile = (id) => {
	return `map_${id}.png`;
};

const getMapId = (map) => {
	return map.itemDamage + map.scale - map.columns - map.rows + map.x + map.y + map.data.slice(0, 5);
};

let mcterm;

const load = (A) => {
	mcterm = A;
};

const main = async () => {
	const maps = [];
	let amogus = 0;
	const onMap = async (map) => {
		if (maps.includes(getMapId(map))) {
			mcterm.bot._client.off('map', onMap);
			await sleep(1000);
			mcterm.bot._client.on('map', onMap);
			return;
		}
		maps[amogus] = getMapId(map);

		if (amogus > 9) amogus = 9;
		else amogus++;
		const { writeFileSync, readdirSync, mkdirSync, lstatSync, rmSync } = require('fs');
		const { join } = require('path');
		let pngImage;
		try {
			pngImage = mapjs(map.data);
		} catch {
			mcterm.error('An error occured while trying to download map');
			return;
		}

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
			if (files.includes(mapOutputFile(id))) id++;
		}
		const mapOutputFullPath = join(mapOutputFolder, mapOutputFile(id));
		writeFileSync(mapOutputFullPath, pngImage);
		mcterm.success(`Map saved as '${mapOutputFullPath}'`);
	};
	mcterm.bot._client.on('map', onMap);
};

module.exports = { load, main, name: 'Map Downloader' };
