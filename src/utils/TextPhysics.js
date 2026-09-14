import TextScreen from "./TextScreen";
import { LOGO_ROWS, LOGO_WIDTH, LOGO_HEIGHT } from "./OmarchyLogo";

export default class TextPhysics {
	constructor(screen, logoScale) {
		this.screen = screen;
		this.scale = logoScale;

		this.pad = 1.5;
		this.friction = 3.5;
		this.spring = 5.0;
		this.hitFade = 1.5;
		this.bounce = 0.4;
		this.pushMin = 700;
		this.pushGain = 1.6;
		this.heatSteps = 28;
		this.lift = 1400;
		this.turbulence = 900;
		this.lean = 0.005;
		this.leanMax = 0.6;
		this.stretch = 0.008;
		this.stretchRange = [0.55, 1.7];
	}

	#hash(x, y) {
		const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
		return v - Math.floor(v);
	}

	#lit(cx, cy) {
		return (
			cx >= 0 &&
			cy >= 0 &&
			cx < LOGO_WIDTH &&
			cy < LOGO_HEIGHT &&
			LOGO_ROWS[cy][cx] === "#"
		);
	}

	#solid(px, py, logoX, logoY) {
		const lx = (px - logoX) / this.scale;
		const ly = (py - logoY) / this.scale;
		for (let dy = -this.pad; dy <= this.pad; dy += this.pad)
			for (let dx = -this.pad; dx <= this.pad; dx += this.pad)
				if (this.#lit(Math.floor(lx + dx), Math.floor(ly + dy))) return true;
		return false;
	}

	#exitDistance(cx, cy, dx, dy, logoX, logoY) {
		let i = 0;
		while (
			i < 400 &&
			this.#solid(cx + dx * i * 2, cy + dy * i * 2, logoX, logoY)
		)
			i++;
		return i;
	}

	#heat(px, py, logoX, logoY, logoVX, logoVY) {
		const lx = (px - logoX) / this.scale;
		const ly = (py - logoY) / this.scale;
		const lean = Math.max(
			-this.leanMax,
			Math.min(this.leanMax, (-logoVX / this.scale) * this.lean),
		);
		const stretch = Math.max(
			this.stretchRange[0],
			Math.min(this.stretchRange[1], 1 + (logoVY / this.scale) * this.stretch),
		);
		for (let k = 0; k < this.heatSteps; k++) {
			const cy = Math.floor(ly + k * 0.6 * stretch);
			if (cy >= LOGO_HEIGHT) return 0;
			if (this.#lit(Math.floor(lx - lean * k), cy))
				return Math.pow(1 - k / this.heatSteps, 1.3);
		}
		return 0;
	}

	update(dt, time, logoX, logoY, logoVX, logoVY) {
		const { CELL_W, CELL_H } = TextScreen;
		const speed = Math.hypot(logoVX, logoVY);
		const maxX = this.screen.width - CELL_W;
		const maxY = this.screen.height - CELL_H;
		const damp = Math.exp(-this.friction * dt);

		for (const c of this.screen.chars) {
			const cx = c.x + CELL_W / 2;
			const cy = c.y + CELL_H / 2;

			if (this.#solid(cx, cy, logoX, logoY)) {
				let [dx, dy] = [
					[0, -1],
					[0, 1],
					[-1, 0],
					[1, 0],
				]
					.map(([x, y]) => [
						x,
						y,
						this.#exitDistance(cx, cy, x, y, logoX, logoY),
					])
					.reduce((a, b) => (b[2] < a[2] ? b : a));
				if (speed > 1) {
					dx = dx * 0.6 + logoVX / speed;
					dy = dy * 0.6 + logoVY / speed;
				}
				const jitter = (this.#hash(c.homeX, c.homeY) - 0.5) * 0.6;
				[dx, dy] = [dx - dy * jitter, dy + dx * jitter];
				const len = Math.hypot(dx, dy) || 1;
				const push = Math.max(this.pushMin, speed * this.pushGain);
				c.vx = (dx / len) * push;
				c.vy = (dy / len) * push;
				c.hit = 1;
			}

			const heat = this.#heat(cx, cy, logoX, logoY, logoVX, logoVY);
			c.heat = heat;
			if (heat > 0) {
				const gust = Math.sin(time * 6 + c.homeX * 0.07 + c.homeY * 0.03);
				c.vy -= this.lift * heat * dt;
				c.vx += this.turbulence * heat * gust * dt;
				c.hit = Math.max(c.hit, heat);
			}

			const home = 1 - heat;
			c.vx += (c.homeX - c.x) * this.spring * home * dt;
			c.vy += (c.homeY - c.y) * this.spring * home * dt;
			c.vx *= damp;
			c.vy *= damp;
			c.x += c.vx * dt;
			c.y += c.vy * dt;

			if (c.x < 0) {
				c.x = 0;
				c.vx = Math.abs(c.vx) * this.bounce;
			} else if (c.x > maxX) {
				c.x = maxX;
				c.vx = -Math.abs(c.vx) * this.bounce;
			}
			if (c.y < 0) {
				c.y = 0;
				c.vy = Math.abs(c.vy) * this.bounce;
			} else if (c.y > maxY) {
				c.y = maxY;
				c.vy = -Math.abs(c.vy) * this.bounce;
			}

			c.hit = Math.max(0, c.hit - this.hitFade * dt);
		}
	}
}
