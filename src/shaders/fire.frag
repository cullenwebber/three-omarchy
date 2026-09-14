precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uScreen;
uniform vec2 uScreenSize;
uniform float uFontPx;
uniform sampler2D uLogo;
uniform vec2 uLogoSize;
uniform vec2 uLogoOrigin;
uniform float uLogoScale;
uniform vec2 uLogoVelocity;
uniform vec3 uBg;
uniform vec3 uLogoColor;
uniform vec3 uFlameRamp[4];

const int HEAT_STEPS = 38;

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
		mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
		f.y
	);
}

float fbm(vec2 p) {
	float v = 0.0;
	float amp = 0.5;
	for (int i = 0; i < 4; i++) {
		v += amp * noise(p);
		p = p * 2.03 + vec2(17.1, 9.7);
		amp *= 0.5;
	}
	return v;
}

bool glyph(int level, ivec2 fp) {
	if (level <= 0) return false;
	if (level >= 4) return true;
	int even = level == 1 ? 0x22 : level == 2 ? 0x55 : 0xDD;
	int odd = level == 1 ? 0x88 : level == 2 ? 0xAA : 0x77;
	int row = (fp.y & 1) == 0 ? even : odd;
	return ((row >> (7 - fp.x)) & 1) == 1;
}

float logo(vec2 p) {
	if (any(lessThan(p, vec2(0.0))) || any(greaterThanEqual(p, uLogoSize))) return 0.0;
	return texelFetch(uLogo, ivec2(p), 0).r;
}

float flame(vec2 lc, float t) {
	float lean = clamp(-uLogoVelocity.x * 0.005, -0.6, 0.6);
	float stretch = clamp(1.0 - uLogoVelocity.y * 0.008, 0.55, 1.7);

	float sway = (fbm(vec2(lc.x * 0.09, t * 0.6)) - 0.5) * 1.4;
	float heat = 0.0;
	for (int k = 0; k < HEAT_STEPS; k++) {
		float fk = float(k);
		heat = max(heat, logo(lc - vec2(sway * fk * 0.3 + lean * fk, fk * 0.6 * stretch)) * (1.0 - fk / float(HEAT_STEPS)));
	}
	heat = pow(heat, 1.3);

	float above = max(0.0, lc.y - uLogoSize.y);
	vec2 ls = vec2(lc.x - lean * above * 1.6, lc.y);
	float curl = (fbm(vec2(ls.x * 0.025, ls.y * 0.04 - t * 0.25)) - 0.5) * 4.0 * (1.0 - heat);
	float ridge = pow(1.0 - abs(2.0 * fbm(vec2(ls.x * 0.14 + curl, ls.y * 0.09 - t * 0.9)) - 1.0), 3.0);
	float columns = 0.5 + 0.8 * fbm(vec2(lc.x * 0.05, t * 0.4));
	return heat * columns * ridge * 2.8 + pow(heat, 8.0) * 1.0;
}

bool fireColor(float x, ivec2 fp, inout vec3 col) {
	float k = (x - 0.15) / 0.45;
	if (k < 0.0) return false;
	int stage = int(min(floor(k), 3.0));
	int level = int(min(fract(k) * 4.0, 3.0)) + 1;
	if (k >= 4.0) level = 4;
	vec3 under = stage == 0 ? col : uFlameRamp[stage - 1];
	col = glyph(level, fp) ? uFlameRamp[stage] : under;
	return true;
}

void main() {
	float fontPx = uFontPx;
	vec2 origin = floor((uResolution - uScreenSize * fontPx) * 0.5);
	vec2 f = (gl_FragCoord.xy - origin) / fontPx;

	vec2 charPx = vec2(8.0, 16.0);
	vec2 cell = floor(f / charPx);
	ivec2 fp = ivec2(mod(f, charPx));
	fp.y = 15 - fp.y;

	vec2 lp = (f - uLogoOrigin) / uLogoScale;

	float t = floor(uTime * 10.0) / 10.0;

	vec2 halfCell = cell * charPx + vec2(4.0, fp.y < 8 ? 12.0 : 4.0);
	vec2 lc = (halfCell - uLogoOrigin) / uLogoScale;
	float intensity = flame(lc, t);

	vec3 col = uBg;

	vec2 suv = f / uScreenSize;
	if (all(greaterThanEqual(suv, vec2(0.0))) && all(lessThan(suv, vec2(1.0)))) {
		vec4 text = texture2D(uScreen, suv);
		if (text.a > 0.5) col = text.rgb;
	}

	vec3 fire = uBg;
	if (fireColor(intensity, fp, fire)) col = fire;

	bool dot = fp.x >= 3 && fp.x <= 4 && fp.y >= 7 && fp.y <= 8;
	if (intensity < 0.15 && dot && hash(cell + floor(t * 3.0)) < intensity * 0.8) col = uFlameRamp[1];

	float near = 0.0;
	for (int dy = -1; dy <= 1; dy++)
		for (int dx = -1; dx <= 1; dx++)
			near = max(near, logo(lp + vec2(dx, dy) * 1.25));
	if (near > 0.5) col = uLogoColor;

	near = 0.0;
	for (int dy = -1; dy <= 1; dy++)
		for (int dx = -1; dx <= 1; dx++)
			near = max(near, logo(lp + vec2(dx, dy) * 1.0));
	if (near > 0.5) col = uBg;

	if (logo(lp) > 0.5) col = intensity > 2.0 && glyph(1, fp) ? uFlameRamp[1] : uLogoColor;

	gl_FragColor = vec4(col, 1.0);

	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
