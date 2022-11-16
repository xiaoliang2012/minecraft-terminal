function init (chat) {
	const { setChat } = require('../lib/commands');
	const { load: promptLoad } = require('../lib/prompt');
	const { setSWInterface } = require('../lib/log');

	promptLoad(chat);
	setSWInterface(chat);
	setChat(chat);
}

module.exports = init;
