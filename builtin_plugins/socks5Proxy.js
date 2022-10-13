const Socks = require('socks').SocksClient;
const ProxyAgent = require('proxy-agent');
const log = require('logger');

const before = (A) => {
	const minecraftHost = A.settings.options.host;
	const minecraftPort = A.settings.options.port;
	const proxyHost = A.settings.settings.config.config.config.mineflayer.proxy.host;
	const proxyPort = A.settings.settings.config.config.config.mineflayer.proxy.port;
	const stream = (client) => {
		Socks.createConnection({
			proxy: {
				host: proxyHost,
				port: proxyPort,
				type: 5
			},
			command: 'connect',
			destination: {
				host: minecraftHost,
				port: Number.parseInt(minecraftPort)
			}
		}, (err, info) => {
			if (err) {
				log.error(`Proxy: ${err.message}`, 2);
				process.exit();
			}
			client.setSocket(info.socket);
			client.emit('connect');
		});
	};
	delete A.settings.options.host;
	delete A.settings.options.port;
	A.settings.options.host = {};
	A.settings.options.host.connect = stream;
	A.settings.options.host.agent = new ProxyAgent({ protocol: 'socks5:', host: proxyHost, port: proxyPort });
	log.info(`Connecting with Socks5 proxy.\nhost: ${proxyHost}\nport: ${proxyPort}`, 2);
};

module.exports = {
	before,
	name: 'Socks5 Proxy'
};
