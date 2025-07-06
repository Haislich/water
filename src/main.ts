import GUI from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { Water } from './water';
import { Caustics } from './caustics';
import { WaterSimulation } from './waterSimulation';
import { Pool } from './pool';
import utils from '../shaders/utils.glsl';
import { CAMERA, CANVAS, DIRECTIONAL_LIGHT, RENDERER } from './constants';
import { Floor } from './floor';
import { Smoke } from './smoke';
import { Sphere } from './sphere';
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

// Inject utilities into the shaders.
// This means that shaders will be able to use the
// `#include <utils>` direcctive and utilize the contants and functions from there.
(THREE.ShaderChunk as Record<string, string>)['utils'] = utils;

const scene = new THREE.Scene();

scene.fog = new THREE.Fog(new THREE.Color('#9e7f3c'), 1, 5);
// scene.background = BACKGROUND;
// Create mouse Controls
const controls = new OrbitControls(CAMERA, CANVAS);
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
// const wireframe = new THREE.WireframeGeometry(targetgeometry);
// const targetline: THREE.LineSegments<THREE.WireframeGeometry<THREE.PlaneGeometry>, THREE.Material, THREE.Object3DEventMap> = new THREE.LineSegments(wireframe);
// targetline.material.depthTest = false;
// targetline.material.opacity = 0.5;
// targetline.material.transparent = true;
// scene.add(targetline);
scene.add(DIRECTIONAL_LIGHT);
const cameraHelper = new THREE.CameraHelper(CAMERA);
scene.add(cameraHelper);

const waterSimulation = new WaterSimulation();
const water = new Water();
const caustics = new Caustics(water.geometry);
const pool = new Pool();
const floor = new Floor();
scene.add(water.aboveWaterMesh);
scene.add(water.underWaterMesh);
scene.add(pool.mesh);
// scene.add(floor.mesh);

// const gltfLoader = new GLTFLoader();
// let duck: THREE.Mesh;
// gltfLoader.load('/models/Duck/glTF/Duck.gltf', (gltf) => {
//     duck = gltf.scene.children[0];
//     duck.scale.setScalar(0.0025);
//     duck.castShadow = true;
//     duck.position.y -= 0.1;
//     scene.add(duck);
// });

// const smoke1 = new Smoke();
// smoke1.mesh.position.z += 0.5;
// scene.add(smoke1.mesh);
// const smoke2 = new Smoke();
// scene.add(smoke2.mesh);
// smoke2.mesh.position.x += 1;

// smoke2.mesh.position.z -= 0.5;

const sphere = new Sphere();
scene.add(sphere.mesh);
// Main rendering loop
const clock = new THREE.Clock();

const animate = (): void => {
    const elapsedTime = clock.getElapsedTime();
    waterSimulation.stepSimulation();
    waterSimulation.updateNormals();
    caustics.update(waterSimulation.texture);
    water.updateUniforms(waterSimulation.texture, caustics.texture);
    pool.updateUniforms(waterSimulation.texture, caustics.texture);
    // smoke1.mesh.material.uniforms['uTime'].value = elapsedTime;
    // smoke2.mesh.material.uniforms['uTime'].value = elapsedTime;
    sphere.mesh.material.uniforms.caustics.value = caustics.texture;
    sphere.mesh.material.uniforms.water.value = waterSimulation.texture;
    RENDERER.render(scene, CAMERA);
    controls.update();
    // waterSimulation.addDrop(0, 0, 0.05, 0.04);
    window.requestAnimationFrame(animate);
};
const rect = CANVAS.getBoundingClientRect();
const onMouseMove = (event: MouseEvent): void => {
    mouse.x = ((event.clientX - rect.left) * 2) / CANVAS.width - 1;
    mouse.y = (-(event.clientY - rect.top) * 2) / CANVAS.height + 1;

    raycaster.setFromCamera(mouse, CAMERA);

    const intersects = raycaster.intersectObject(targetmesh);

    for (const intersect of intersects) {
        waterSimulation.addDrop(intersect.point.x, intersect.point.z, 0.03, 0.04);
    }
};

CANVAS.addEventListener('mousemove', onMouseMove);
// for (let i = 0; i < 20; i++) {
//     waterSimulation.addDrop(Math.random() * 2 - 1, Math.random() * 2 - 1, 0.03, i & 1 ? 0.02 : -0.02);
// }

animate();
