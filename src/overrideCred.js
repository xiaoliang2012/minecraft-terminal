module.exports = (settings) => {
	const confCredKeys = Object.keys(settings.config.config.cred);
	const botCredKeys = Object.keys(settings.bot.cred);
	for (let i = 0; i < botCredKeys.length; i++) {
		const botCredValue = settings.bot.cred[botCredKeys[i]];
		const confCredValue = settings.config.config.cred[confCredKeys[i]];
		if (confCredValue === undefined || botCredValue !== undefined) {
			settings.bot.cred[botCredKeys[i]] = botCredValue;
		} else if (botCredValue === undefined) {
			settings.bot.cred[botCredKeys[i]] = confCredValue;
		}
	}
};
