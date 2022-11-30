/**
 * Returns a random integer between the specified minimum and maximum values.
 */
module.exports = (min, max) => {
	return Math.floor(Math.random() * (max - min) + min);
};
