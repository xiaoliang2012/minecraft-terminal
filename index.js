#!/usr/bin/env node

// Set global settings
const settings = new (require('./src/settings'))();

// Check if the 'configPath.toml' file exists if not create it
require('./src/configPath');

// Parse cmd args
require('./src/getOpts')(settings);

// Set uncaught exception message
require('./src/uncaughtExcep')(settings.logging.debug);
require('events').EventEmitter.defaultMaxListeners = 0;

// Generate and update config
require('./src/updateConfig');

// Load config
settings.config.config = require('./src/loadConfig')(settings);

// Start the progress bar
const progress = require('progress');
progress.start(0, 1, 100, 0, 20, '\rLoading: ');

// Override credentials
require('./src/overrideCred')(settings);

// Import modules

// Init readline chat
const readline = require('readline');
const chat = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
chat.once('close', async () => {
	process.exit();
});
require('./src/initChat')(chat);

// Stop the progress bar
progress.stop();

(
	async () => {
		// Prompt for credentials and modify them
		await require('./src/promptCred')(settings, chat);

		// set the port
		if (/(?<=:)\d+/.test(settings.bot.cred.server)) {
			settings.bot.cred.port = settings.bot.cred.server.match(/(?<=:)\d+/)[0];
		}

		// Bot main
		let bot;
		const botMain = require('./src/botMain');
		botMain.setup(bot, chat, settings);
		botMain();
	}
)();
