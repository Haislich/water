import * as THREE from 'three';

// Light direction
export const LIGHT = new THREE.Vector3(0.7559289460184544, 0.7559289460184544, -0.3779644730092272);

const textureLoader = new THREE.TextureLoader();
export const TILES = textureLoader.load('textures/tiles.jpg');

const cubetextureloader = new THREE.CubeTextureLoader();

export const CUBE_TEXTURE = cubetextureloader.load(['textures/xpos.jpg', 'textures/xneg.jpg', 'textures/ypos.jpg', 'textures/ypos.jpg', 'textures/zpos.jpg', 'textures/zneg.jpg']);

export const CANVAS = document.querySelector('canvas.webgl')! as HTMLCanvasElement;

export const WIDTH = CANVAS.width;
export const HEIGHT = CANVAS.height;

export const CAMERA = new THREE.PerspectiveCamera(75, CANVAS.width / CANVAS.height, 0.01, 100);
CAMERA.position.set(0.426, 0.677, -2.095);
CAMERA.rotation.set(2.828, 0.191, 3.108);

export const RENDERER = new THREE.WebGLRenderer({ canvas: CANVAS, alpha: true });
RENDERER.setSize(window.innerWidth, window.innerHeight);
RENDERER.setPixelRatio(Math.min(window.devicePixelRatio, 2));

window.addEventListener('resize', () => {
    // Update camera
    CAMERA.aspect = window.innerWidth / window.innerHeight;
    CAMERA.updateProjectionMatrix();

    // Update renderer
    RENDERER.setSize(window.innerWidth, window.innerHeight);
    RENDERER.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
