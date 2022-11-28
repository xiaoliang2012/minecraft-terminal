
const mcServer = require('flying-squid');

const port = process.argv[2];
const version = process.argv[3];

mcServer.createMCServer({
	motd: 'A Minecraft Server \nRunning flying-squid',
	port,
	'max-players': 10,
	'online-mode': false,
	logging: true,
	gameMode: 0,
	difficulty: 0,
	worldFolder: 'world',
	generation: {
		name: 'superflat',
		options: {
			worldHeight: 80
		}
	},
	kickTimeout: 10000,
	plugins: {

	},
	modpe: false,
	'view-distance': 10,
	'player-list-text': {
		header: 'Flying squid',
		footer: 'Test server'
	},
	'everybody-op': true,
	'max-entities': 10,
	version
});
