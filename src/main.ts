import GUI from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { Water } from './water';
import { Caustics } from './caustics';
import { WaterSimulation } from './waterSimulation';
import { Pool } from './pool';
import utils from '../shaders/utils.glsl';
import { CAMERA, CANVAS, CUBE_TEXTURE, DIRECTIONAL_LIGHT, RENDERER } from './constants';
import { Floor } from './floor';
import { Smoke } from './smoke';
import { Sphere } from './sphere';
import { Sky } from 'three/addons/objects/Sky.js';
import { setupSimulationGUI } from './utils/simulationParameters';

// const description = document.createElement('div');
// description.innerHTML = `
//   <strong>Project:</strong> Water Simulation<br>
//   <em>This project showcases animated water using custom shaders and an EXR environment map.</em>
// `;
// description.style.padding = '8px';
// description.style.fontSize = '12px';
// description.style.lineHeight = '1.4';
// description.style.color = '#ccc';

// // Inject into GUI
// gui.domElement.prepend(description);

const gui = new GUI({ width: 340 });
setupSimulationGUI(gui);

// Inject utilities into the shaders.
// This means that shaders will be able to use the
// `#include <utils>` direcctive and utilize the contants and functions from there.
(THREE.ShaderChunk as Record<string, string>)['utils'] = utils;

const scene = new THREE.Scene();

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
scene.add(DIRECTIONAL_LIGHT);
const cameraHelper = new THREE.CameraHelper(CAMERA);
scene.add(cameraHelper);

const sky = new Sky();
sky.scale.setScalar(450000);

// const phi = THREE.MathUtils.degToRad(90);
// const theta = THREE.MathUtils.degToRad(180);
// const sunPosition = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);

// Assume DIRECTIONAL_LIGHT is already added to the scene
// and has a position you want the sun to match
const lightDir = DIRECTIONAL_LIGHT.position.clone().normalize();

// The Sky shader expects the sun position as a direction vector,
// typically with a large magnitude
const sunPosition = lightDir.clone().multiplyScalar(450000);
sky.material.uniforms.sunPosition.value.copy(sunPosition);

sky.material.uniforms.sunPosition.value = sunPosition;

scene.add(sky);

const waterSimulation = new WaterSimulation();
const water = new Water();
const caustics = new Caustics(water.geometry);
const pool = new Pool();
const floor = new Floor();
scene.add(water.mesh);
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
    const deltaTime = clock.getDelta();

    waterSimulation.stepSimulation();
    waterSimulation.updateNormals();

    caustics.update(waterSimulation.texture);
    water.updateUniforms(waterSimulation.texture, caustics.texture);
    pool.updateUniforms(waterSimulation.texture, caustics.texture);
    sphere.updateUniforms(waterSimulation.texture, caustics.texture);
    sphere.updatePhysics(deltaTime, waterSimulation);

    RENDERER.render(scene, CAMERA);
    controls.update();
    window.requestAnimationFrame(animate);
};
let isDragging = false;
const dragPlane = new THREE.Plane();
const dragOffset = new THREE.Vector3();
const intersectionPoint = new THREE.Vector3();

const onMouseMove = (event: MouseEvent): void => {
    const rect = CANVAS.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) * 2) / CANVAS.width - 1;
    mouse.y = (-(event.clientY - rect.top) * 2) / CANVAS.height + 1;

    raycaster.setFromCamera(mouse, CAMERA);

    if (isDragging) {
        // Ray-plane intersection to find 3D drag point
        raycaster.ray.intersectPlane(dragPlane, intersectionPoint);

        if (intersectionPoint) {
            const newCenter = intersectionPoint.clone().sub(dragOffset);
            const currentPos = sphere.mesh.position.clone();
            const delta = newCenter.sub(currentPos);
            // sphere.move(delta.x, delta.y, delta.z);
            // waterSimulation.displaceVolume(sphere.oldCenter, sphere.newCenter, sphere.radius);
            const prev = sphere.newCenter.clone(); // capture before move
            sphere.move(delta.x, delta.y, delta.z);
            // waterSimulation.displaceVolume(prev, sphere.newCenter, sphere.radius);
            sphere.oldCenter = prev; // update after the displacement
        }
    } else {
        // Regular water drop logic when not dragging
        const intersects = raycaster.intersectObject(targetmesh);
        for (const intersect of intersects) {
            // waterSimulation.addDrop(intersect.point.x, intersect.point.z, 0.03, 0.04);
        }
    }
};
CANVAS.addEventListener('mousedown', (event) => {
    const rect = CANVAS.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, CAMERA);
    const intersects = raycaster.intersectObject(sphere.mesh, true);

    if (intersects.length > 0) {
        controls.enabled = false;
        isDragging = true;

        dragPlane.setFromNormalAndCoplanarPoint(CAMERA.getWorldDirection(new THREE.Vector3()).negate(), intersects[0].point);
        dragOffset.copy(intersects[0].point).sub(sphere.mesh.position);
    } else {
        controls.enabled = true; // let orbit controls do their thing
        isDragging = false;
    }
});

CANVAS.addEventListener('mouseup', () => {
    isDragging = false;
    controls.enabled = true;
});

// CANVAS.addEventListener('mousedown', onMouseDown);
CANVAS.addEventListener('mousemove', onMouseMove);
// CANVAS.addEventListener('mouseup', onMouseUp);

// CANVAS.addEventListener('mousemove', onMouseMove);
// for (let i = 0; i < 20; i++) {
//     waterSimulation.addDrop(Math.random() * 2 - 1, Math.random() * 2 - 1, 0.03, i & 1 ? 0.02 : -0.02);
// }

animate();
