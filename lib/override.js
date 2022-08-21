const override = (arr1, arr2) => {
	let index;
	if (arr1.length > arr2.length) index = arr1.length;
	else index = arr2.length;
	const out = arr1;
	for (let i = 0; i < index; i++) {
		if (arr1[i] === undefined) out[i] = arr2[i];
	}
	return out;
};

module.exports = override;
