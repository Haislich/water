import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

export const NOISE_TEXTURE = textureLoader.load('textures/noiseTexture.png');

NOISE_TEXTURE.wrapS = THREE.RepeatWrapping;
NOISE_TEXTURE.wrapT = THREE.RepeatWrapping;
NOISE_TEXTURE.colorSpace = THREE.SRGBColorSpace;

export const FLOOR_COLOR = textureLoader.load('floor/rocky_trail_02_1k/textures/rocky_trail_02_diff_1k.jpg');
export const FLOOR_ARM = textureLoader.load('floor/rocky_trail_02_1k/textures/rocky_trail_02_arm_1k.jpg');
export const FLOOR_NORMAL = textureLoader.load('floor/rocky_trail_02_1k/textures/rocky_trail_02_nor_gl_1k.jpg');
export const FLOOR_DISPLACEMENT = textureLoader.load('floor/rocky_trail_02_1k/textures/rocky_trail_02_disp_1k.jpg');

FLOOR_COLOR.colorSpace = THREE.SRGBColorSpace;

FLOOR_COLOR.repeat.set(8, 8);
FLOOR_ARM.repeat.set(8, 8);
FLOOR_NORMAL.repeat.set(8, 8);
FLOOR_DISPLACEMENT.repeat.set(8, 8);

FLOOR_COLOR.wrapS = THREE.RepeatWrapping;
FLOOR_ARM.wrapS = THREE.RepeatWrapping;
FLOOR_NORMAL.wrapS = THREE.RepeatWrapping;
FLOOR_DISPLACEMENT.wrapS = THREE.RepeatWrapping;

FLOOR_COLOR.wrapT = THREE.RepeatWrapping;
FLOOR_ARM.wrapT = THREE.RepeatWrapping;
FLOOR_NORMAL.wrapT = THREE.RepeatWrapping;
FLOOR_DISPLACEMENT.wrapT = THREE.RepeatWrapping;

export const CANVAS = document.querySelector('canvas.webgl')! as HTMLCanvasElement;

export const WIDTH = CANVAS.width;
export const HEIGHT = CANVAS.height;

export const CAMERA = new THREE.PerspectiveCamera(75, CANVAS.width / CANVAS.height, 0.01, 100);
CAMERA.position.set(0.426, 0.677, -2.095);
// CAMERA.position.set(0.426, 0, -2.095);
CAMERA.rotation.set(2.828, 0.191, 3.108);
CAMERA.layers.enable(0); // default
CAMERA.layers.enable(1); // ball layer

const context = CANVAS.getContext('webgl') as WebGLRenderingContext;
export const RENDERER = new THREE.WebGLRenderer({ canvas: CANVAS, alpha: true, antialias: true, context });
RENDERER.setSize(window.innerWidth, window.innerHeight);
RENDERER.setPixelRatio(Math.min(window.devicePixelRatio, 2));
RENDERER.shadowMap.enabled = true;
RENDERER.outputColorSpace = THREE.SRGBColorSpace;

window.addEventListener('resize', () => {
    // Update camera
    CAMERA.aspect = window.innerWidth / window.innerHeight;
    CAMERA.updateProjectionMatrix();

    // Update renderer
    RENDERER.setSize(window.innerWidth, window.innerHeight);
    RENDERER.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
