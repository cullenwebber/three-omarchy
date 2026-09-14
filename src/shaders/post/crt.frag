precision highp float;

uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uPixelRatio;
uniform float uTime;

uniform vec2 uCurvature;
uniform float uCornerRadius;
uniform float uAberration;
uniform float uScanlines;
uniform float uScanlineCount;
uniform float uMask;
uniform float uVignette;
uniform float uFlicker;
uniform float uBrightness;

varying vec2 vUv;

vec2 curve(vec2 uv) {
	uv = uv * 2.0 - 1.0;
	vec2 off = abs(uv.yx) / uCurvature;
	uv += uv * off * off;
	return uv * 0.5 + 0.5;
}

float bezel(vec2 uv) {
	vec2 d = abs(uv - 0.5) - (0.5 - uCornerRadius);
	float dist = length(max(d, 0.0)) - uCornerRadius;
	return 1.0 - smoothstep(-0.002, 0.002, dist);
}

vec3 sampleScreen(vec2 uv) {
	vec2 dir = uv - 0.5;
	float r = texture2D(tDiffuse, uv + dir * uAberration).r;
	float g = texture2D(tDiffuse, uv).g;
	float b = texture2D(tDiffuse, uv - dir * uAberration).b;
	return vec3(r, g, b);
}

void main() {
	vec2 uv = curve(vUv);
	float inside = bezel(uv);
	if (inside <= 0.0) {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}

	vec3 col = sampleScreen(uv);
	float lum = dot(col, vec3(0.299, 0.587, 0.114));

	float line = fract(uv.y * uScanlineCount) - 0.5;
	float width = mix(0.28, 0.5, lum);
	float beam = exp(-line * line / (width * width));
	col *= mix(1.0 - uScanlines, 1.0, beam);

	float stripe = mod(floor(gl_FragCoord.x / uPixelRatio), 3.0);
	vec3 grille = vec3(stripe == 0.0, stripe == 1.0, stripe == 2.0);
	col *= mix(vec3(1.0), grille * 3.0, uMask * 0.5);

	float roll = smoothstep(0.0, 0.3, fract(uv.y - uTime * 0.12)) * smoothstep(0.6, 0.3, fract(uv.y - uTime * 0.12));
	col *= 1.0 + roll * 0.015;
	col *= 1.0 - uFlicker * (0.5 + 0.5 * sin(uTime * 120.0 * 6.2832));

	vec2 v = uv * (1.0 - uv);
	col *= pow(v.x * v.y * 16.0, uVignette);

	col *= uBrightness * inside;
	gl_FragColor = vec4(col, 1.0);
}
