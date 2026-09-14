import * as THREE from "three";

export default class TextScreen {
	static CELL_W = 8;
	static CELL_H = 16;

	constructor(width, height) {
		this.chars = [];
		this.ready = false;
		this.font = `${TextScreen.CELL_H}px "IBM VGA"`;

		this.canvas = document.createElement("canvas");
		this.canvas.width = width;
		this.canvas.height = height;
		this.ctx = this.canvas.getContext("2d");

		this.texture = new THREE.CanvasTexture(this.canvas);
		this.texture.colorSpace = THREE.SRGBColorSpace;
		this.texture.magFilter = THREE.NearestFilter;
		this.texture.minFilter = THREE.NearestFilter;
		this.texture.generateMipmaps = false;
	}

	get width() {
		return this.canvas.width;
	}

	get height() {
		return this.canvas.height;
	}

	resize(width, height, dx, dy) {
		this.canvas.width = width;
		this.canvas.height = height;
		for (const c of this.chars) {
			c.homeX += dx;
			c.homeY += dy;
			c.x += dx;
			c.y += dy;
		}
		this.render();
	}

	async setLines(lines, originX, originY) {
		await document.fonts.load(this.font);
		const { CELL_W, CELL_H } = TextScreen;

		this.chars = [];
		lines.forEach((segments, row) => {
			let col = 0;
			for (const [text, color] of segments) {
				for (const ch of text) {
					const x = originX + col * CELL_W;
					const y = originY + row * CELL_H;
					const onScreen = x >= 0 && y >= 0 && x + CELL_W <= this.width && y + CELL_H <= this.height;
					if (ch !== " " && onScreen) {
						this.chars.push({ ch, color, homeX: x, homeY: y, x, y, vx: 0, vy: 0, hit: 0, heat: 0 });
					}
					col++;
				}
			}
		});

		this.ready = true;
		this.render();
	}

	render(ramp = []) {
		if (!this.ready) return;
		const { ctx, canvas } = this;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.font = this.font;
		ctx.textBaseline = "top";
		for (const c of this.chars) {
			ctx.fillStyle =
				c.heat > 0 && ramp.length ? ramp[Math.min(ramp.length - 1, Math.floor(c.heat * ramp.length))]
				: c.hit > 0 && ramp.length ? ramp[0]
				: c.color;
			ctx.fillText(c.ch, Math.round(c.x), Math.round(c.y));
		}
		this.texture.needsUpdate = true;
	}
}
