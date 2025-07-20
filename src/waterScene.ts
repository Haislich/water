import GUI from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';

import { Water } from './water';
import { Caustics } from './caustics';
import { WaterSimulation } from './waterSimulation';
import { Pool } from './pool';
import { Floor } from './floor';
import { Smoke } from './smoke';
import { Sphere } from './sphere';
import utils from '../shaders/utils.glsl';
import { CAMERA, CANVAS, RENDERER } from './utils/constants';
import { DIRECTIONAL_LIGHT, params, setupSimulationGUI } from './utils/simulationParameters';
import { SPHERE_CENTER } from './utils/globals';

/**
 * High level application controller. Handles scene setup and the main loop.
 */
export class WaterScene {
    private readonly scene = new THREE.Scene();
    private readonly gui = new GUI({ width: 340 });
    private readonly controls = new OrbitControls(CAMERA, CANVAS);
    private readonly clock = new THREE.Clock();
    private readonly raycaster = new THREE.Raycaster();
    private readonly mouse = new THREE.Vector2();
    private readonly targetMesh: THREE.Mesh;
    private readonly dragPlane = new THREE.Plane();
    private readonly dragOffset = new THREE.Vector3();
    private readonly intersectionPoint = new THREE.Vector3();

    private isDragging = false;
    private readonly waterSimulation = new WaterSimulation();
    private readonly caustics = new Caustics();
    private readonly water = new Water(this.waterSimulation, this.caustics);
    private readonly pool = new Pool();
    private readonly floor = new Floor();
    private readonly sphere = new Sphere(this.waterSimulation, this.caustics);
    private readonly smoke1 = new Smoke();
    private readonly smoke2 = new Smoke();
    private readonly sky = new Sky();
    private readonly gltfLoader = new GLTFLoader();
    private readonly mountains: THREE.Group[] = [];
    private readonly pines: THREE.Group[] = [];

    constructor() {
        this.setupGui();
        setupSimulationGUI(this.gui);

        const targetGeometry = new THREE.PlaneGeometry(2, 2);
        this.targetMesh = new THREE.Mesh(targetGeometry, new THREE.MeshStandardMaterial({ wireframe: true, transparent: true, visible: false }));
        this.targetMesh.rotateX(-Math.PI / 2);

        this.setupScene();
        this.loadEnvironment();
        this.setupEvents();

        // expose utils for shader includes
        (THREE.ShaderChunk as Record<string, string>)['utils'] = utils;
    }

    /** Starts the rendering loop */
    start(): void {
        this.animate();
    }

    private setupScene(): void {
        this.sky.scale.setScalar(450000);
        this.sky.material.uniforms.sunPosition.value = DIRECTIONAL_LIGHT.position;

        this.scene.add(DIRECTIONAL_LIGHT);
        this.scene.add(this.sky);
        this.scene.add(this.pool.mesh);
        this.scene.add(this.water.mesh);
        this.scene.add(this.floor.mesh);
        this.scene.add(this.smoke1.mesh);
        this.scene.add(this.smoke2.mesh);
        this.scene.add(this.sphere.mesh);
        this.scene.add(this.water.cubeCamera);
        this.scene.add(this.targetMesh);
    }
    /** Loads environment models such as mountains and pine trees. */
    private loadEnvironment(): void {
        this.gltfLoader.load('/models/mountain/scene.gltf', (gltf) => {
            const m1 = gltf.scene.clone();
            m1.position.set(-16.1, 1.6, 5.7);
            m1.rotateY(0.6);

            const m2 = gltf.scene.clone();
            m2.position.set(1.7, 2.1, 8.9);
            m2.rotateY(-1.42);

            const m3 = gltf.scene.clone();
            m3.position.set(15.4, 1.6, 7.3);
            m3.rotateY(-3.14);

            this.scene.add(m1, m2, m3);
            this.mountains.push(m1, m2, m3);
        });

        this.gltfLoader.load('/models/pine_tree/scene.gltf', (gltf) => {
            const p2 = gltf.scene.clone();
            p2.position.set(1, 0, 4.1);
            p2.scale.setScalar(0.02);

            const p3 = gltf.scene.clone();
            p3.position.set(4.1, 0, 0.1);
            p3.scale.setScalar(0.02);

            const p5 = gltf.scene.clone();
            p5.position.set(-3.2, 0, 1.7);
            p5.scale.setScalar(0.02);

            this.scene.add(p2, p3, p5);
            this.pines.push(p2, p3, p5);
        });
    }

    private setupGui(): void {
        const description = document.createElement('div');
        description.innerHTML =
            '\n      <strong>Project:</strong> Water Simulation<br>\n      <em>This project showcases animated hotsprings using custom shaders and Three JS.</em>\n    ';
        description.style.padding = '8px';
        description.style.fontSize = '12px';
        description.style.lineHeight = '1.4';
        description.style.color = '#ccc';
        this.gui.domElement.prepend(description);
        this.gui.close();
    }

    private setupEvents(): void {
        CANVAS.addEventListener('mousedown', (event) => this.onPointerDown(event));
        CANVAS.addEventListener('mouseup', () => this.onPointerUp());
        CANVAS.addEventListener('mousemove', (event) => this.onPointerMove(event));
    }

    private onPointerDown(event: MouseEvent): void {
        const rect = CANVAS.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, CAMERA);
        const intersects = this.raycaster.intersectObject(this.sphere.mesh, true);
        if (intersects.length > 0) {
            this.controls.enabled = false;
            this.isDragging = true;
            this.sphere.usePhysics = false;

            const intersection = intersects[0].point.clone();
            this.dragPlane.setFromNormalAndCoplanarPoint(CAMERA.getWorldDirection(new THREE.Vector3()).negate(), intersection);
            this.dragOffset.copy(intersection).sub(SPHERE_CENTER);
        } else {
            this.controls.enabled = true;
            this.isDragging = false;
        }
    }

    private onPointerUp(): void {
        this.isDragging = false;
        this.sphere.usePhysics = true;
        this.controls.enabled = true;
    }

    private onPointerMove(event: MouseEvent): void {
        const rect = CANVAS.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, CAMERA);

        if (this.isDragging) {
            this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint);
            if (this.intersectionPoint) {
                const newCenter = this.intersectionPoint.clone().sub(this.dragOffset);
                const delta = newCenter.sub(this.sphere.mesh.position);
                const prev = this.sphere.center.clone();
                this.sphere.move(delta.x, delta.y, delta.z);
                this.waterSimulation.displaceVolume(prev, this.sphere.center, params.sphereRadius);
            }
        } else {
            const intersects = this.raycaster.intersectObject(this.targetMesh);
            for (const intersect of intersects) {
                this.waterSimulation.addDrop(intersect.point.x, intersect.point.z, 0.01, 0.04);
            }
        }
    }

    private animate = (): void => {
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();

        this.controls.update();
        this.floor.mesh.visible = CAMERA.position.y >= 0;

        this.waterSimulation.stepSimulation();
        this.waterSimulation.updateNormals();
        this.caustics.updateUniforms(this.waterSimulation.texture);
        this.sphere.updateUniforms();
        this.water.updateUniforms(this.waterSimulation, this.caustics, this.sphere);
        this.water.updateReflection(this.scene, this.sphere);
        this.pool.updateUniforms(this.waterSimulation.texture, this.caustics.texture);
        this.sphere.updatePhysics(deltaTime, this.waterSimulation);
        this.smoke1.updateUniforms(elapsedTime);
        this.smoke2.updateUniforms(elapsedTime);

        RENDERER.render(this.scene, CAMERA);
        requestAnimationFrame(this.animate);
    };
}

export default WaterScene;
