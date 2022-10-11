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

// Init readline chat
const readline = require('readline');
const chat = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
require('./src/initChat')(chat);

const progress = require('progress');
const PACKAGE = require('PACKAGE');
const logger = require('logger');
const sleep = require('sleep');


