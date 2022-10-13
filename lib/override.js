const override = (arr1, arr2) => {
	const out = arr1;
	for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
		if (arr1[i] === undefined) out[i] = arr2[i];
	}
	return out;
};

module.exports = override;
