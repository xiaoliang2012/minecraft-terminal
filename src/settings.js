class Settings {
	logging = {
		debug: false
	};

	bot = {
		cred: {
			auth: undefined,
			name: undefined,
			password: undefined,
			server: undefined,
			version: undefined
		}
	};

	config = {
		enabled: {
			cred: true,
			config: true,
			plugins: true,
			physics: false
		},
		config: {}
	};
};

module.exports = Settings;
