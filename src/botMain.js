const logger = require('logger');
const ansi = require('ansi');
const parseVar = require('../lib/parseVar');
const mineflayer = require('mineflayer');
const PACKAGE = require('PACKAGE');
const commands = require('../lib/commands');

const getPlugins = require('./getPlugins');

let bot, chat, settings;

const checkForUpdates = () => {
	const getPackage = require('../lib/getPackage');
	getPackage(PACKAGE.name)
		.then(({ version }) => {
			const compareVer = require('../lib/compareVer');
			const diff = compareVer(version, PACKAGE.version);
			if (diff > 0) {
				let importance = 'PATCH';
				if (diff === 1) importance = logger.highLight1('MAJOR') + '%COLOR%';
				if (diff === 2) importance = logger.highLight1('MINOR') + '%COLOR%';
				logger.warn(`A new ${importance} version of '${PACKAGE.name}' is out.\nUpdate with: npm up -g ${PACKAGE.name}`);
			} else if (diff !== 0) {
				logger.warn(`You somehow have a newer version of '${PACKAGE.name}' than the latest one available.\nConsider running: npm up -g ${PACKAGE.name}`);
			}
		})
		.catch(() => {});
};

const getCommandPrompt = (name, server) => {
	if (settings.config.config.config?.commands?.commandPrompt !== undefined) {
		return ansi.MCColor.c2c(parseVar(settings.config.config.config.commands.commandPrompt, { name, server }, '%', '%'), '&');
	} else {
		return '>';
	}
};

const connectErr = (err) => {
	logger.error('Could not connect to server.\n' + err.message, 2);
	process.exit(1);
};

function setup (BOT, CHAT, SETTINGS) {
	bot = BOT;
	chat = CHAT;
	settings = SETTINGS;
	commands.setChat(chat);
	commands.setConfig({ settings });
	commands.setbotMain(this);
}

function botMain () {
	chat.pause();
	ansi.clear.clearLine(true);
	logger.info('Loading...', 3);

	// Mineflayer bot creation options
	const options = {
		auth: settings.bot.cred.auth,
		username: settings.bot.cred.username,
		password: settings.bot.cred.password,
		host: settings.bot.cred.server,
		version: settings.bot.cred.version,
		port: settings.bot.cred.port,
		logErrors: false
	};
	commands.setConfig({ settings, options });

	// Load plugins (first pass)
	const plugins = getPlugins(settings);
	commands.loadPlugins(plugins, true);

	ansi.clear.clearLine(true);
	logger.info('Connecting...', 3);

	// Try to create bot and connect to server
	try {
		bot = mineflayer.createBot(options);
	} catch (err) {
		connectErr(err);
	}
	commands.setBot(bot);

	// Load plugins (second pass)
	commands.loadPlugins(plugins, false);

	bot.once('error', connectErr);

	bot._client.once('connect', () => {
		bot.off('error', connectErr);
		// Set command prompt
		// Can't you just use the name right away?
		commands.commands.tmp.botMoving = false;
		commands.commands.tmp.botLooking = false;
		commands.commands.tmp.botAttacking = false;
		commands.commands.tmp.lookInt = undefined;
		// // script = { length: 0, msg: [] };

		logger.info('Logging in...', 3);
		ansi.clear.clearLine(true);
		chat.setPrompt(getCommandPrompt('Loading', settings.bot.cred.server));
		chat.line = '';
		chat.resume();
		chat.prompt();
	});

	// Chat input and check for updates
	bot.once('login', async () => {
		ansi.clear.clearLine(true);
		logger.success('Logged in');
		chat.setPrompt(getCommandPrompt(bot.username, settings.bot.cred.server));

		// Get input
		chat.on('line', (msg) => {
			commands.commands.cmd(msg);
			chat.prompt();
		});

		// Check for updates
		checkForUpdates();
	});

	// Detect chat messages and print them to console
	bot.on('message', (rawmsg) => {
		const message = rawmsg.toMotd();
		const messageColor = ansi.MCColor.c2c(message);
		logger.safeWrite(messageColor);
	});

	// Send a message on death
	bot.on('death', () => {
		logger.warn('You died. Respawning');
	});

	// exit mc-term when disconnected
	bot.once('end', async (reason) => {
		if (reason !== 'reconnect') {
			logger.info('Exiting', 2);
			process.exit();
		}
	});

	// send disconnect reason
	bot.on('kicked', (reason) => {
		logger.warn(`Kicked from ${settings.bot.cred.server}:`);
		logger.safeWrite(`${ansi.MCColor.c2c(JSON.parse(reason).text) + ansi.color.reset}`);
		process.stdout.write('\r');
	});

	// set terminal title
	bot.once('spawn', async () => {
		ansi.other.setTermTitle(`${bot.player?.username || settings.bot.cred.username} @ ${settings.bot.cred.server}`);
	});
}

module.exports = botMain;
module.exports.setup = setup;
