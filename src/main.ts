import GUI from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { Water } from './water';
import { Caustics } from './caustics';
import { WaterSimulation } from './waterSimulation';
import { Pool } from './pool';
import utils from '../shaders/utils.glsl';
import { CAMERA, CANVAS, RENDERER } from './utils/constants';
import { Floor } from './floor';
import { Smoke } from './smoke';
import { Sphere } from './sphere';
import { Sky } from 'three/addons/objects/Sky.js';
import { DIRECTIONAL_LIGHT, params, setupSimulationGUI } from './utils/simulationParameters';
import { SPHERE_CENTER } from './utils/globals';

const setupGui = (gui: GUI): void => {
    const description = document.createElement('div');
    description.innerHTML = `
      <strong>Project:</strong> Water Simulation<br>
      <em>This project showcases animated hotsprings using custom shaders and Three JS.</em>
    `;
    description.style.padding = '8px';
    description.style.fontSize = '12px';
    description.style.lineHeight = '1.4';
    description.style.color = '#ccc';
    gui.domElement.prepend(description);
    gui.close();
};
const setupDebugGui = (gui: GUI, scene: THREE.Scene): void => {
    const debugFolder = gui.addFolder('Debug');
    const options = {
        showDragPlane: false,
        showLightHelper: false,
        showCameraHelper: false,
        showReflectionCameraHelper: false,
    };

    // Toggle for drag plane helper
    debugFolder.add(options, 'showDragPlane').onChange((value: boolean) => {
        if (value) {
            if (!debugObjects.dragPlaneHelper) {
                debugObjects.dragPlaneHelper = new THREE.PlaneHelper(dragPlane, 2, 0xff0000);
                scene.add(debugObjects.dragPlaneHelper);
            }
        } else {
            if (debugObjects.dragPlaneHelper) {
                scene.remove(debugObjects.dragPlaneHelper);
                debugObjects.dragPlaneHelper = null;
            }
        }
    });

    // Toggle for light helper
    debugFolder.add(options, 'showLightHelper').onChange((value: boolean) => {
        if (value) {
            if (!debugObjects.lightHelper) {
                debugObjects.lightHelper = new THREE.DirectionalLightHelper(DIRECTIONAL_LIGHT, 0.5);
                scene.add(debugObjects.lightHelper);
            }
        } else {
            if (debugObjects.lightHelper) {
                scene.remove(debugObjects.lightHelper);
                debugObjects.lightHelper = null;
            }
        }
    });

    // Toggle for camera helper
    debugFolder.add(options, 'showCameraHelper').onChange((value: boolean) => {
        if (value) {
            if (!debugObjects.cameraHelper) {
                debugObjects.cameraHelper = new THREE.CameraHelper(CAMERA);
                scene.add(debugObjects.cameraHelper);
            }
        } else {
            if (debugObjects.cameraHelper) {
                scene.remove(debugObjects.cameraHelper);
                debugObjects.cameraHelper = null;
            }
        }
    });
    debugFolder.add(options, 'showReflectionCameraHelper').onChange((value: boolean) => {
        if (value) {
            if (!debugObjects.cubeCameraHelper) {
                debugObjects.cubeCameraHelper = [];

                // Assuming water.cubeCamera.children contains six PerspectiveCameras
                for (const camera of water.cubeCamera.children) {
                    const helper = new THREE.CameraHelper(camera);
                    scene.add(helper);
                    debugObjects.cubeCameraHelper.push(helper);
                }
            }
        } else {
            if (debugObjects.cubeCameraHelper) {
                for (const helper of debugObjects.cubeCameraHelper) {
                    scene.remove(helper);
                }
                debugObjects.cubeCameraHelper = null;
            }
        }
    });
};
type LabeledObject = {
    name: string;
    object: THREE.Object3D;
};

export const setupMountainGui = (gui: GUI, mountains: LabeledObject[]): void => {
    const folder = gui.addFolder('Mountains');

    mountains.forEach(({ name, object }) => {
        const sub = folder.addFolder(name);

        const pos = object.position;
        sub.add(pos, 'x', -50, 50, 0.1).name('Position X');
        sub.add(pos, 'y', -10, 20, 0.1).name('Position Y');
        sub.add(pos, 'z', -50, 50, 0.1).name('Position Z');

        const rot = object.rotation;
        sub.add(rot, 'y', -Math.PI, Math.PI, 0.01).name('Rotation Y');

        const uniformScale = { scale: object.scale.x }; // local control

        sub.add(uniformScale, 'scale', 0.1, 5, 0.01)
            .name('Scale')
            .onChange((v: number) => {
                object.scale.set(v, v, v);
            });
    });

    folder.open();
};

const gui = new GUI({ width: 340 });

const scene = new THREE.Scene();
const debugObjects = {
    dragPlaneHelper: null as THREE.PlaneHelper | null,
    lightHelper: null as THREE.DirectionalLightHelper | null,
    cameraHelper: null as THREE.CameraHelper | null,
    cubeCameraHelper: null as THREE.CameraHelper[] | null,
};

setupGui(gui);
setupSimulationGUI(gui);
setupDebugGui(gui, scene);
// Inject utilities into the shaders.
// This means that shaders will be able to use the
// `#include <utils>` direcctive and utilize the contants and functions from there.
(THREE.ShaderChunk as Record<string, string>)['utils'] = utils;

const gltfLoader = new GLTFLoader();

let mountain1: THREE.Group | null = null;
let mountain2: THREE.Group | null = null;
let mountain3: THREE.Group | null = null;
gltfLoader.load('/models/mountain/scene.gltf', (gltf) => {
    mountain1 = gltf.scene.clone();
    mountain1.position.set(-16.1, 1.6, 5.7);
    mountain1.rotateY(0.6);

    mountain2 = gltf.scene.clone();
    mountain2.position.set(1.7, 2.1, 8.9);
    mountain2.rotateY(-1.42);

    mountain3 = gltf.scene.clone();
    mountain3.position.set(15.4, 1.6, 7.3);
    mountain3.rotateY(-3.14);

    scene.add(mountain1);
    scene.add(mountain2);
    scene.add(mountain3);

    // setupMountainGui(gui, [
    //     { name: 'Mountain 1', object: mountain1 },
    //     { name: 'Mountain 2', object: mountain2 },
    //     { name: 'Mountain 3', object: mountain3 },
    // ]);
});
let pine2: THREE.Group | null = null;
let pine3: THREE.Group | null = null;
let pine5: THREE.Group | null = null;
gltfLoader.load('/models/pine_tree/scene.gltf', (gltf) => {
    pine2 = gltf.scene.clone();
    pine2.position.set(1, 0, 4.1);
    pine2.scale.setScalar(0.02);
    pine2.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    pine3 = gltf.scene.clone();
    pine3.position.set(4.1, 0, 0.1);
    pine3.scale.setScalar(0.02);
    pine3.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    pine5 = gltf.scene.clone();
    pine5.position.set(-3.2, 0, 1.7);
    pine5.scale.setScalar(0.02);
    pine5.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(pine2);
    scene.add(pine3);
    scene.add(pine5);

    setupMountainGui(gui, [
        { name: 'Mountain 1', object: pine2 },
        { name: 'Mountain 2', object: pine3 },
        { name: 'Mountain 3', object: pine5 },
    ]);
});

const controls = new OrbitControls(CAMERA, CANVAS);
const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();
const targetgeometry = new THREE.PlaneGeometry(2, 2);
const targetmesh = new THREE.Mesh(targetgeometry, new THREE.MeshStandardMaterial({ wireframe: true, transparent: true, visible: false }));
targetmesh.rotateX(-Math.PI / 2);
scene.add(DIRECTIONAL_LIGHT);
scene.add(targetmesh);
const sky = new Sky();
sky.scale.setScalar(450000);
sky.material.uniforms.sunPosition.value = DIRECTIONAL_LIGHT.position;
scene.add(sky);

const waterSimulation = new WaterSimulation();
const caustics = new Caustics();
const water = new Water(waterSimulation, caustics);
const pool = new Pool();
const floor = new Floor();
scene.add(pool.mesh);
scene.add(water.mesh);
scene.add(floor.mesh);

const smoke1 = new Smoke();
smoke1.mesh.position.z += 0.5;
scene.add(smoke1.mesh);
const smoke2 = new Smoke();
scene.add(smoke2.mesh);
smoke2.mesh.position.x += 1;
smoke2.mesh.position.z -= 0.5;

const sphere = new Sphere(waterSimulation, caustics);
scene.add(sphere.mesh);

scene.add(water.cubeCamera);
const clock = new THREE.Clock();
const animate = (): void => {
    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    controls.update();
    if (CAMERA.position.y < 0) {
        floor.mesh.visible = false;
    } else {
        floor.mesh.visible = true;
    }

    waterSimulation.stepSimulation();
    waterSimulation.updateNormals();
    caustics.updateUniforms(waterSimulation.texture);
    sphere.updateUniforms();
    water.updateUniforms(waterSimulation, caustics, sphere);
    water.updateReflection(scene, sphere);

    pool.updateUniforms(waterSimulation.texture, caustics.texture);
    sphere.updatePhysics(deltaTime, waterSimulation);
    smoke1.updateUniforms(elapsedTime);
    smoke2.updateUniforms(elapsedTime);
    RENDERER.render(scene, CAMERA);
    requestAnimationFrame(animate);
};

let isDragging = false;
const dragPlane = new THREE.Plane();
const dragOffset = new THREE.Vector3();
const intersectionPoint = new THREE.Vector3();

CANVAS.addEventListener('mousedown', (event) => {
    const rect = CANVAS.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, CAMERA);
    const intersects = raycaster.intersectObject(sphere.mesh, true);

    if (intersects.length > 0) {
        controls.enabled = false;
        isDragging = true;
        sphere.usePhysics = false;

        const intersection = intersects[0].point.clone();
        dragPlane.setFromNormalAndCoplanarPoint(CAMERA.getWorldDirection(new THREE.Vector3()).negate(), intersection);

        // Use actual mesh position, not SPHERE_CENTER
        dragOffset.copy(intersection).sub(SPHERE_CENTER);
    } else {
        controls.enabled = true; // let orbit controls do their thing
        isDragging = false;

        controls.enabled = true;
    }
});

CANVAS.addEventListener('mouseup', () => {
    isDragging = false;
    sphere.usePhysics = true;
    controls.enabled = true;
});

CANVAS.addEventListener('mousemove', (event: MouseEvent): void => {
    const rect = CANVAS.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, CAMERA);

    if (isDragging) {
        // Ray-plane intersection to find 3D drag point
        raycaster.ray.intersectPlane(dragPlane, intersectionPoint);

        if (intersectionPoint) {
            const newCenter = intersectionPoint.clone().sub(dragOffset);
            const delta = newCenter.sub(sphere.mesh.position);

            const prev = sphere.center.clone(); // capture before move
            sphere.move(delta.x, delta.y, delta.z);
            waterSimulation.displaceVolume(prev, sphere.center, params.sphereRadius);
        }
    } else {
        // Regular water drop logic when not dragging
        const intersects = raycaster.intersectObject(targetmesh);
        for (const intersect of intersects) {
            waterSimulation.addDrop(intersect.point.x, intersect.point.z, 0.01, 0.04);
        }
    }
});

for (let i = 0; i < 20; i++) {
    waterSimulation.addDrop(Math.random() * 2 - 1, Math.random() * 2 - 1, 0.03, i & 1 ? 0.02 : -0.02);
}

animate();
