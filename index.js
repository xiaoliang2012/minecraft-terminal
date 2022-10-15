#!/usr/bin/env node

// Set global settings
const settings = new (require('./src/settings'))();

// Check if the 'configPath.toml' file exists if not create it
require('./src/configPath');

// Parse cmd args
require('./src/getOpts')(settings);

const logger = require('logger');

// Loading
logger.info('Loading...', 3);

// Generate and update config
require('./src/updateConfig');

// Load config
settings.config.config = require('./src/loadConfig')(settings);

// Override credentials
require('./src/overrideCred')(settings);

// Import modules
const { EventEmitter } = require('events');
const botMain = require('./src/botMain');
const readline = require('readline');
require('./lib/commands');

// Set uncaught exception message
require('./src/uncaughtExcep')(settings.logging.debug);
EventEmitter.defaultMaxListeners = 0;

// Init readline chat
const chat = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
chat.setPrompt('');
chat.once('close', async () => {
	process.stdout.write('\n');
	process.exit();
});

// Stop the progress bar
// progress.stop();

require('./src/initChat')(chat);

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
		botMain.setup(bot, chat, settings);
		botMain();
	}
)();
