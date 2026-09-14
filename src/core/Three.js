import * as THREE from "three";
import WebGLContext from "./WebGLContext";
import Scene from "../scenes/Scene";
import PostProcessing from "./PostProcessing";

class Three {
	constructor(container) {
		this.container = container;
		this.context = null;
		this.clock = new THREE.Clock();
	}

	run() {
		this.context = new WebGLContext(this.container);
		this.context.init();
		this.scene = new Scene();
		this.post = new PostProcessing(this.context.renderer, this.scene.scene, this.scene.camera);
		this.post.setScanlineCount(this.scene.layout.height);
		this.#animate();
		this.#addResizeListener();
	}

	#animate() {
		const delta = this.clock.getDelta();
		const elapsed = this.clock.elapsedTime;

		this.scene.animate(delta, elapsed);
		this.#render(delta, elapsed);
		requestAnimationFrame(() => this.#animate());
	}

	#render(delta, elapsed) {
		this.post.render(delta, elapsed);
	}

	#addResizeListener() {
		window.addEventListener("resize", () => this.#onResize());
	}

	#onResize() {
		const { width, height } = this.context.getFullScreenDimensions();
		this.context.onResize(width, height);
		this.scene.onResize(width, height);
		this.post.setSize(width, height);
		this.post.setScanlineCount(this.scene.layout.height);
	}
}

export default Three;
