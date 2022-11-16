const betterMerge = require('../lib/mergeObj');
const { readdirSync } = require('fs');
const TOML = require('@iarna/toml');
const { join } = require('path');
const mainPath = require('../lib/mainPath');
const configPath = require('../lib/configPath')().path;

const MP = mainPath();

readdirSync(join(MP, 'default_config')).forEach(file => {
	const { writeFileSync, readFileSync } = require('fs');
	const filePath = join(configPath, file);
	const defaultconfigPath = join(MP, 'default_config', file);
	try {
		require.resolve(filePath);
	} catch (err) {
		const { cpSync } = require('fs');
		cpSync(defaultconfigPath, filePath);
		return;
	}
	const config = readFileSync(filePath);
	const defaultConfig = readFileSync(defaultconfigPath);
	const out = betterMerge(TOML.parse(config), TOML.parse(defaultConfig));
	const TOMLString = TOML.stringify(out).replace(/ {2}/g, '\t');
	writeFileSync(filePath, TOMLString, 'utf-8');
});
