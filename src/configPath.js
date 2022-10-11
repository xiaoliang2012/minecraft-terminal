const mainPath = require('mainpath');
const logger = require('logger');
const { join } = require('path');
const { existsSync } = require('fs');

const configPathPath = join(mainPath(), 'configPath.toml');

if (!existsSync(configPathPath)) {
	const { writeFileSync } = require('fs');
	const { stringify: TOMLStringify } = require('@iarna/toml');
	let dir;
	if (process.platform === 'win32') dir = join(__dirname, 'config');
	else dir = join(require('os').homedir(), '.config', 'mc-term');
	if (!existsSync(dir)) {
		const { mkdirSync } = require('fs');
		mkdirSync(dir, { recursive: true });
	}
	const defaultPath = dir;
	writeFileSync(configPathPath, TOMLStringify({ configpath: defaultPath }), (err) => {
		if (err) logger.error(err);
	});
}
