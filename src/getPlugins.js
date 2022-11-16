const requireTOML = require('../lib/requireTOML');
const configPath = require('../lib/configPath')().path;
const mainPath = require('../lib/mainPath')();
const { join } = require('path');

module.exports = function getPlugins (settings) {
	// Load plugin
	const absPath = require('../lib/absolutePath');
	if (settings.config.enabled.plugins === true) {
		const plug = requireTOML(`${configPath}/plugins.toml`);
		const configBuiltinPluginNames = Object.keys(plug.builtin);

		const builtinPlugins = {
			mapDownloader: join(mainPath, './builtin_plugins/mapdown.js'),
			autoFish: join(mainPath, './builtin_plugins/autoFish.js'),
			socks5Proxy: join(mainPath, './builtin_plugins/socks5Proxy.js'),
			webView: join(mainPath, './builtin_plugins/webView.js')
		};

		const builtinPluginNames = Object.keys(builtinPlugins);
		const builtinPluginPaths = Object.values(builtinPlugins);
		const enabledBuiltinPluginPaths = [];

		for (let i = 0, p = 0; i < configBuiltinPluginNames.length; i++) {
			if (plug.builtin[builtinPluginNames[i]] === true) {
				enabledBuiltinPluginPaths[p] = builtinPluginPaths[i];
				p++;
			}
		}
		const enabledPlugins = [...enabledBuiltinPluginPaths, ...plug.user];
		const enabledPluginsAbs = [];
		for (let i = 0, p = 0; i < enabledPlugins.length; i++) {
			const enabledPlugin = enabledPlugins[i];
			if (enabledPlugin !== '' && typeof enabledPlugin === 'string') {
				enabledPluginsAbs[p] = absPath(enabledPlugin);
				p++;
			}
		}
		return enabledPluginsAbs;
	}
};
