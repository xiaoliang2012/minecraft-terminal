let INTERFACE;
const load = (int) => {
	INTERFACE = int;
};

const prompt = async (prompt) => {
	INTERFACE.setPrompt(prompt);
	INTERFACE.prompt();
	return await new Promise((resolve) => INTERFACE.on('line', resolve));
};

module.exports = { prompt, load };
