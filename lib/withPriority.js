const sleep = require('./sleep');

withPriority.cache = {
	priority: 0,
	cooldown: 0
};
async function withPriority (priority = 0, cooldown = 0, DO = true, countSamePriority = false, cache = { priority: 0, cooldown: 0 }, callback = () => {}) {
	if (isNaN(cooldown)) {
		return;
	}
	let s = false;
	if (priority < cache.priority || (countSamePriority === true && priority <= cache.priority)) {
		const slp = cache.cooldown - Date.now();
		if (slp > 0) {
			if (DO === true) await sleep(slp);
			s = true;
		}
	} else {
		if (cache.cooldown < Date.now() + cooldown) {
			cache.priority = priority;
			cache.cooldown = Date.now() + cooldown;
		}
	}

	if (s === false || DO === true) {
		callback?.();
	}
}

module.exports = withPriority;
