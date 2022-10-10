const Socks = require('socks').SocksClient;
const ProxyAgent = require('proxy-agent');
const log = require('../lib/log');

const before = (A) => {
	const minecraftHost = A.config.options.host;
	const minecraftPort = A.config.options.port;
	const proxyHost = A.config.mineflayer.proxy.host;
	const proxyPort = A.config.mineflayer.proxy.port;
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
	delete A.config.options.host;
	delete A.config.options.port;
	A.config.options.connect = stream;
	A.config.options.agent = new ProxyAgent({ protocol: 'socks5:', host: proxyHost, port: proxyPort });
	log.info(`Connecting with Socks5 proxy.\nhost: ${proxyHost}\nport: ${proxyPort}`, 2);
};

module.exports = {
	before,
	name: 'Socks5 Proxy'
};
