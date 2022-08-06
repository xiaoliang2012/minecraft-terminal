const a = require('./sleep');
const curpos = () => new Promise((resolve) => {
	const t = '\u001b[6n';

	const rawmode = process.stdin.isRaw;
	process.stdin.setEncoding('utf8');
	process.stdin.setRawMode(true);

	const readfx = async function () {
		const buf = process.stdin.read();
		const str = JSON.stringify(buf); // "\u001b[9;1R"
		const regex = /\[(.*)/g;
		const xy = regex.exec(str)[0].replace(/\[|R"/g, '').split(';');
		const pos = { rows: xy[0], cols: xy[1] };
		resolve(pos);
		process.stdin.setRawMode(false);
		//await a(100)
		process.stdin.setRawMode(rawmode);
	};

	process.stdin.once('readable', readfx);
	process.stdout.write(t);
	
})


module.exports = curpos;
