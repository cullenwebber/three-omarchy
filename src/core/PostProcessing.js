import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from "three/addons/postprocessing/AfterimagePass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import crtVertex from "../shaders/post/crt.vert";
import crtFragment from "../shaders/post/crt.frag";

export default class PostProcessing {
	constructor(renderer, scene, camera, options = {}) {
		this.renderer = renderer;

		const o = {
			bloom: { strength: 0.22, radius: 0.5, threshold: 0.575 },
			persistence: 0.3,
			curvature: [4.0, 3],
			cornerRadius: 0.035,
			aberration: 0.0022,
			scanlines: 0.8,
			scanlineCount: 0,
			mask: 1,
			vignette: 0.5,
			flicker: 0.04,
			brightness: 1.1,
			...options,
		};
		this.options = o;

		this.composer = new EffectComposer(renderer);
		this.composer.addPass(new RenderPass(scene, camera));

		this.bloom = new UnrealBloomPass(
			new THREE.Vector2(1, 1),
			o.bloom.strength,
			o.bloom.radius,
			o.bloom.threshold,
		);
		this.composer.addPass(this.bloom);

		this.afterimage = new AfterimagePass(o.persistence);
		this.composer.addPass(this.afterimage);

		this.crt = new ShaderPass({
			uniforms: {
				tDiffuse: { value: null },
				uResolution: { value: new THREE.Vector2() },
				uPixelRatio: { value: renderer.getPixelRatio() },
				uTime: { value: 0 },
				uCurvature: { value: new THREE.Vector2(...o.curvature) },
				uCornerRadius: { value: o.cornerRadius },
				uAberration: { value: o.aberration },
				uScanlines: { value: o.scanlines },
				uScanlineCount: { value: 1 },
				uMask: { value: o.mask },
				uVignette: { value: o.vignette },
				uFlicker: { value: o.flicker },
				uBrightness: { value: o.brightness },
			},
			vertexShader: crtVertex,
			fragmentShader: crtFragment,
		});
		this.composer.addPass(this.crt);

		this.composer.addPass(new OutputPass());

		const size = renderer.getSize(new THREE.Vector2());
		this.setSize(size.x, size.y);
	}

	setSize(width, height) {
		const pixelRatio = this.renderer.getPixelRatio();
		this.composer.setSize(width, height);
		this.bloom.setSize(width, height);

		const u = this.crt.uniforms;
		u.uResolution.value.set(width * pixelRatio, height * pixelRatio);
		u.uPixelRatio.value = pixelRatio;
		u.uScanlineCount.value = this.options.scanlineCount || height;
	}

	setScanlineCount(count) {
		this.options.scanlineCount = count;
		this.crt.uniforms.uScanlineCount.value = count;
	}

	render(delta, elapsed) {
		this.crt.uniforms.uTime.value = elapsed;
		this.composer.render(delta);
	}
}
