#!/usr/bin/env node

// Set global settings
const settings = new (require('./src/settings'))();

// Parse cmd args
require('./src/getOpts')(settings);

// Set uncaught exception message
require('./src/uncaughtExcep')(settings.debug);
require('events').EventEmitter.defaultMaxListeners = 0;

// Check if the 'configPath.toml' file exists if not create it
require('./src/configPath');

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
const PACKAGE = require('PACKAGE');
const logger = require('logger');
const sleep = require('sleep');
const mineflayer = require('mineflayer');

// Init readline chat
const readline = require('readline');
const chat = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
require('./src/initChat')(chat);

// Stop the progress bar
progress.stop();

// Prompt for credentials
require('./src/promptCred')(settings, chat);
