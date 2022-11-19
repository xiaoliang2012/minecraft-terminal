const betterMerge = require('../lib/mergeObj');
const { readdirSync } = require('fs');
const TOML = require('@iarna/toml');
const logger = require('../lib/log');
const { join } = require('path');
const mainPath = require('../lib/mainPath');
const configPath = require('../lib/configPath')().path;

const MP = mainPath();

const onlyKeepKeys = require('../lib/onlyKeepKeys');

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
	let out;
	try {
		const config = readFileSync(filePath, 'UTF8');
		const defaultConfig = readFileSync(defaultconfigPath, 'UTF8');
		const parsedDefaultConfig = TOML.parse(defaultConfig);
		const parsedConfig = onlyKeepKeys(TOML.parse(config), parsedDefaultConfig);
		out = betterMerge(parsedConfig, parsedDefaultConfig);
	} catch {
		return;
	}

	let TOMLString;
	try {
		TOMLString = TOML.stringify(out).replace(/ {2}/g, '\t');
	} catch (e) {
		logger.error(`An error occurred while trying to parse ${file}.\n${e.message}`);
		return;
	}

	try {
		writeFileSync(filePath, TOMLString, 'utf-8');
	} catch (e) {
		logger.error(`An error occurred while trying to update ${file}.\n${e.message}`);
	}
});
