import * as THREE from 'three';

// Light direction
// export const LIGHT = new THREE.Vector3(0.7559289460184544, 0.7559289460184544, -0.3779644730092272);
// Create the actual directional light
export const DIRECTIONAL_LIGHT = new THREE.DirectionalLight(0xffffff, 7.0);
DIRECTIONAL_LIGHT.position.set(1, 1, -0.5).normalize(); // or any other direction

// Export its normalized direction separately (to use in shaders)
export const LIGHT = DIRECTIONAL_LIGHT.position.clone().normalize();

const textureLoader = new THREE.TextureLoader();
export const TILES = textureLoader.load('textures/tiles.jpg');
export const ALPHA_MAP = textureLoader.load('floor/alpha.webp');

// export const FLOOR_COLOR = textureLoader.load('floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_diff_1k.webp');
// export const FLOOR_ARM = textureLoader.load('floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_arm_1k.webp');
// export const FLOOR_NORMAL = textureLoader.load('floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_nor_gl_1k.webp');
// export const FLOOR_DISPLACEMENT = textureLoader.load('floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_disp_1k.webp');
export const NOISE_TEXTURE = textureLoader.load('textures/noiseTexture.png');

NOISE_TEXTURE.wrapS = THREE.RepeatWrapping;
NOISE_TEXTURE.wrapT = THREE.RepeatWrapping;

export const FLOOR_COLOR = textureLoader.load('floor/sand_01_1k/textures/sand_01_diff_1k.jpg');

export const FLOOR_ARM = textureLoader.load('floor/sand_01_1k/textures/sand_01_arm_1k.jpg');
export const FLOOR_NORMAL = textureLoader.load('floor/sand_01_1k/textures/sand_01_nor_gl_1k.jpg');
export const FLOOR_DISPLACEMENT = textureLoader.load('floor/sand_01_1k/textures/sand_01_disp_1k.jpg');

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

const cubetextureloader = new THREE.CubeTextureLoader();

export const CUBE_TEXTURE = cubetextureloader.load(['textures/xpos.jpg', 'textures/xneg.jpg', 'textures/ypos.jpg', 'textures/ypos.jpg', 'textures/zpos.jpg', 'textures/zneg.jpg']);
// export const CUBE_TEXTURE = cubetextureloader.load(['textures/posx.jpg', 'textures/negx.jpg', 'textures/posy.jpg', 'textures/posy.jpg', 'textures/posz.jpg', 'textures/negz.jpg']);

// export const BACKGROUND = CUBE_TEXTURE.clone();
// BACKGROUND.flipY = true;

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

export const SPHERE_RADIUS = 0.2;
export const SPHERE_CENTER = new THREE.Vector3(0, -0.5, 0);
