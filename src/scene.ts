import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';

import { Water } from './water';
import { Caustics } from './caustics';
import { Smoke } from './smoke';
import { Floor } from './floor';
import { Sphere } from './sphere';
import { WaterSimulation } from './waterSimulation';
import { DIRECTIONAL_LIGHT, params } from './utils/simulationParameters';
import { CAMERA, CANVAS, RENDERER } from './utils/constants';
import { Pool } from './pool';
import { SPHERE_CENTER } from './utils/globals';

export class Scene extends THREE.Scene {
    private readonly controls: OrbitControls = new OrbitControls(CAMERA, CANVAS);

    private readonly raycaster = new THREE.Raycaster();
    private readonly mouse = new THREE.Vector2();
    private readonly clock = new THREE.Clock();

    private readonly dragPlane = new THREE.Plane();
    private readonly dragOffset = new THREE.Vector3();
    private readonly intersectionPoint = new THREE.Vector3();
    private isDragging = false;

    private readonly sphere = new Sphere();
    private readonly water = new Water();
    private readonly waterSimulation = new WaterSimulation();
    private readonly pool = new Pool();
    private readonly smoke1 = new Smoke();
    private readonly smoke2 = new Smoke();
    private readonly caustics = new Caustics(this.water.geometry);
    private readonly targetMesh = new THREE.Mesh(this.water.geometry, new THREE.MeshBasicMaterial({ visible: false }));
    constructor() {
        super();

        this.targetMesh.rotation.x = -Math.PI / 2;
        this.add(this.targetMesh);

        this.init();
        this.addEventListeners();
    }

    private init(): void {
        this.raycaster.layers.enable(0);
        this.raycaster.layers.enable(1);

        this.add(this.water.mesh);
        this.add(this.pool.mesh);
        this.add(this.sphere.mesh);
        this.add(DIRECTIONAL_LIGHT);
        this.add(DIRECTIONAL_LIGHT.target);

        const sky = new Sky();
        sky.scale.setScalar(450000);
        sky.material.uniforms.sunPosition.value = DIRECTIONAL_LIGHT.position;
        this.add(sky);

        this.smoke1.mesh.position.z += 0.5;
        this.smoke2.mesh.position.set(1, 0, -0.5);
    }

    private addEventListeners(): void {
        CANVAS.addEventListener('mousedown', this.onMouseDown.bind(this));
        CANVAS.addEventListener('mouseup', this.onMouseUp.bind(this));
        CANVAS.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    private updateMouse(event: MouseEvent): void {
        const rect = CANVAS.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    private onMouseDown(event: MouseEvent): void {
        this.updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, CAMERA);
        const intersects = this.raycaster.intersectObject(this.sphere.mesh, true);

        if (intersects.length > 0) {
            this.controls.enabled = false;
            this.isDragging = true;
            this.sphere.usePhysics = false;

            const intersection = intersects[0].point.clone();
            this.dragPlane.setFromNormalAndCoplanarPoint(CAMERA.getWorldDirection(new THREE.Vector3()).negate(), intersection);
            this.dragOffset.copy(intersection).sub(this.sphere.mesh.position);
        } else {
            this.controls.enabled = true;
        }
    }

    private onMouseUp(): void {
        this.isDragging = false;
        this.sphere.usePhysics = true;
        this.controls.enabled = true;
    }

    private onMouseMove(event: MouseEvent): void {
        this.updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, CAMERA);

        if (this.isDragging) {
            if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint)) {
                const newCenter = this.intersectionPoint.clone().sub(this.dragOffset);
                const delta = newCenter.sub(SPHERE_CENTER);

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

    public animate(): void {
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();

        this.controls.update();

        this.waterSimulation.stepSimulation();
        this.waterSimulation.updateNormals();
        this.caustics.updateUniforms(this.waterSimulation.texture);
        this.water.updateUniforms(this.waterSimulation.texture, this.caustics.texture);
        this.pool.updateUniforms(this.waterSimulation.texture, this.caustics.texture);
        this.sphere.updateUniforms(this.waterSimulation.texture, this.caustics.texture);
        this.sphere.updatePhysics(elapsedTime, this.waterSimulation);
        this.smoke1.updateUniforms(elapsedTime);
        this.smoke2.updateUniforms(elapsedTime);

        RENDERER.render(this, CAMERA);
    }
}
