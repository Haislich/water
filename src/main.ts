import GUI from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

import { Water } from './water';
import { Caustics } from './caustics';
import { WaterSimulation } from './waterSimulation';
// import { Water } from 'src/water.ts';
const gui = new GUI({ width: 340 });

const description = document.createElement('div');
description.innerHTML = `
  <strong>Project:</strong> Water Simulation<br>
  <em>This project showcases animated water using custom shaders and an EXR environment map.</em>
`;
description.style.padding = '8px';
description.style.fontSize = '12px';
description.style.lineHeight = '1.4';
description.style.color = '#ccc';

// Inject into GUI
gui.domElement.prepend(description);
const canvas = document.getElementById('canvas')! as HTMLCanvasElement;

const width = canvas.width;
const height = canvas.height;

// Colors
const black = new THREE.Color('black');
const white = new THREE.Color('white');

function loadFile(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // console.log(void)
        const loader = new THREE.FileLoader();

        loader.load(
            filename,
            (data) => resolve(data), // onLoad
            undefined, // onProgress (optional)
            (err) => reject(err) // onError
        );
    });
}

// Shader chunks
loadFile('shaders/utils.glsl').then((utils) => {
    THREE.ShaderChunk['utils'] = utils;

    // Create Renderer
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 100);
    camera.position.set(0.426, 0.677, -2.095);
    camera.rotation.set(2.828, 0.191, 3.108);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
    renderer.setSize(width, height);
    renderer.autoClear = false;

    // Light direction
    const light = [0.7559289460184544, 0.7559289460184544, -0.3779644730092272];

    // Create mouse Controls
    const controls = new OrbitControls(camera, canvas);

    controls.rotateSpeed = 2.5;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.9;
    // Ray caster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const targetgeometry = new THREE.PlaneGeometry(2, 2);
    const position = targetgeometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
        const y = position.getY(i);
        position.setY(i, 0); // y = 0
        position.setZ(i, -y); // z = -originalY
    }

    position.needsUpdate = true;
    const targetmesh = new THREE.Mesh(targetgeometry);

    // Textures
    const cubetextureloader = new THREE.CubeTextureLoader();

    const textureCube = cubetextureloader.load(['xpos.jpg', 'xneg.jpg', 'ypos.jpg', 'ypos.jpg', 'zpos.jpg', 'zneg.jpg']);

    const textureloader = new THREE.TextureLoader();

    const tiles = textureloader.load('tiles.jpg');

    class Pool {
        constructor() {
            this._geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, -1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1,
                1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1,
            ]);
            const indices = new Uint32Array([0, 1, 2, 2, 1, 3, 4, 5, 6, 6, 5, 7, 12, 13, 14, 14, 13, 15, 16, 17, 18, 18, 17, 19, 20, 21, 22, 22, 21, 23]);

            this._geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            this._geometry.setIndex(new THREE.BufferAttribute(indices, 1));

            const shadersPromises = [loadFile('shaders/pool/vertex.glsl'), loadFile('shaders/pool/fragment.glsl')];

            this.loaded = Promise.all(shadersPromises).then(([vertexShader, fragmentShader]) => {
                this._material = new THREE.RawShaderMaterial({
                    uniforms: {
                        light: { value: light },
                        tiles: { value: tiles },
                        water: { value: null },
                        causticTex: { value: null },
                    },
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                });
                this._material.side = THREE.FrontSide;

                this._mesh = new THREE.Mesh(this._geometry, this._material);
            });
        }

        draw(renderer, waterTexture, causticsTexture) {
            this._material.uniforms['water'].value = waterTexture;
            this._material.uniforms['causticTex'].value = causticsTexture;

            renderer.render(this._mesh, camera);
        }
    }

    const waterSimulation = new WaterSimulation();
    const water = new Water(light, tiles, textureCube);
    const caustics = new Caustics(water.geometry);
    const pool = new Pool();

    // Main rendering loop
    function animate() {
        waterSimulation.stepSimulation(renderer);
        waterSimulation.updateNormals(renderer);

        const waterTexture = waterSimulation.texture.texture;

        caustics.update(renderer, waterTexture);

        const causticsTexture = caustics.texture.texture;

        renderer.setRenderTarget(null);
        renderer.setClearColor(white, 1);
        renderer.clear();

        water.draw(camera, renderer, waterTexture, causticsTexture);
        pool.draw(renderer, waterTexture, causticsTexture);

        controls.update();

        window.requestAnimationFrame(animate);
    }

    function onMouseMove(event) {
        const rect = canvas.getBoundingClientRect();

        mouse.x = ((event.clientX - rect.left) * 2) / width - 1;
        mouse.y = (-(event.clientY - rect.top) * 2) / height + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(targetmesh);

        for (const intersect of intersects) {
            waterSimulation.addDrop(renderer, intersect.point.x, intersect.point.z, 0.03, 0.04);
        }
    }

    const loaded = [waterSimulation.loaded, caustics.loaded, water.loaded, pool.loaded];

    Promise.all(loaded).then(() => {
        canvas.addEventListener('mousemove', { handleEvent: onMouseMove });

        for (let i = 0; i < 20; i++) {
            waterSimulation.addDrop(renderer, Math.random() * 2 - 1, Math.random() * 2 - 1, 0.03, i & 1 ? 0.02 : -0.02);
        }

        animate();
    });
});
