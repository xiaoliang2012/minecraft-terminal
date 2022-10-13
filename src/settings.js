class Settings {
	logging = {
		debug: false
	};

	bot = {
		cred: {
			auth: undefined,
			username: undefined,
			password: undefined,
			server: undefined,
			version: undefined,
			port: 25565
		}
	};

	config = {
		enabled: {
			cred: true,
			config: true,
			plugins: true,
			physics: false
		},
		config: {
			cred: {},
			config: {},
			plugins: {},
			physics: {}
		}
	};
}

module.exports = Settings;
