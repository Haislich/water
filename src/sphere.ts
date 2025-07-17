import * as THREE from 'three';
import sphereVert from '../shaders/sphere/vertex.glsl';
import sphereFrag from '../shaders/sphere/fragment.glsl';
import { SPHERE_CENTER } from './utils/globals';
import { params, DIRECTIONAL_LIGHT } from './utils/simulationParameters';
import type { WaterSimulation } from './waterSimulation';
import type { Caustics } from './caustics';

const BALL_LAYER = 1;

export class Sphere {
    public geometry: THREE.SphereGeometry;
    public mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
    public oldCenter = SPHERE_CENTER.clone();
    public currentCenter = new THREE.Vector3();
    public velocity = new THREE.Vector3();
    public mass: number;
    public gravity = new THREE.Vector3(0, -9.8, 0);
    public usePhysics = true;

    constructor(waterSimulation: WaterSimulation, caustics: Caustics, mass: number = 1) {
        this.mass = mass;
        this.geometry = new THREE.SphereGeometry();

        const shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: sphereVert,
            fragmentShader: sphereFrag,
            uniforms: {
                wallLightAbsorption: new THREE.Uniform(params.wallLightAbsorption),
                aoStrength: new THREE.Uniform(params.aoStrength),
                aoFalloffPower: new THREE.Uniform(params.aoFalloffPower),
                baseLightDiffuse: new THREE.Uniform(params.baseLightDiffuse),
                causticProjectionScale: new THREE.Uniform(params.causticProjectionScale),
                causticBoost: new THREE.Uniform(params.causticBoost),

                light: new THREE.Uniform(DIRECTIONAL_LIGHT.position),
                sphereCenter: new THREE.Uniform(SPHERE_CENTER.clone()),
                sphereRadius: new THREE.Uniform(params.sphereRadius),
                water: new THREE.Uniform(waterSimulation.texture),
                causticTex: new THREE.Uniform(caustics.texture),

                underwaterColor: new THREE.Uniform(params.underWater),
            },
        });

        this.mesh = new THREE.Mesh(this.geometry, shaderMaterial);
        this.mesh.layers.set(BALL_LAYER);
        this.updatePosition(SPHERE_CENTER);
    }

    get center(): THREE.Vector3 {
        return SPHERE_CENTER;
    }

    updateUniforms(): void {
        const uniforms = this.mesh.material.uniforms;
        uniforms['sphereRadius'].value = params.sphereRadius;
        uniforms['wallLightAbsorption'].value = params.wallLightAbsorption;
        uniforms['aoStrength'].value = params.aoStrength;
        uniforms['aoFalloffPower'].value = params.aoFalloffPower;
        uniforms['baseLightDiffuse'].value = params.baseLightDiffuse;
        uniforms['causticProjectionScale'].value = params.causticProjectionScale;
        uniforms['causticBoost'].value = params.causticBoost;
        uniforms['sphereCenter'].value.copy(SPHERE_CENTER);
    }

    move(dx: number, dy: number, dz: number): THREE.Vector3 {
        const limit = 1 - params.sphereRadius;

        const x = Math.max(-limit, Math.min(limit, this.mesh.position.x + dx));
        const yMin = params.sphereRadius - 1;
        const yMax = 1;
        const y = Math.max(yMin, Math.min(yMax, this.mesh.position.y + dy));
        const z = Math.max(-limit, Math.min(limit, this.mesh.position.z + dz));

        const newPos = new THREE.Vector3(x, y, z);
        this.oldCenter.copy(SPHERE_CENTER);
        this.updatePosition(newPos);
        return newPos;
    }

    updatePhysics(deltaTime: number, water: WaterSimulation): void {
        if (!this.usePhysics) return;

        const y = SPHERE_CENTER.y;
        const radius = params.sphereRadius;
        const percentUnderwater = Math.max(0, Math.min(1, (radius - y) / (2 * radius)));

        const adjustedGravity = this.gravity.clone().multiplyScalar(deltaTime * (1 - 1.1 * percentUnderwater));
        this.velocity.add(adjustedGravity);

        const speed = this.velocity.length();
        if (speed > 0.0001) {
            const drag = this.velocity
                .clone()
                .normalize()
                .multiplyScalar(percentUnderwater * deltaTime * speed * speed);
            this.velocity.sub(drag);
        }

        const delta = this.velocity.clone().multiplyScalar(deltaTime);
        const prev = SPHERE_CENTER.clone();
        const bottomBefore = prev.y - radius;

        this.move(delta.x, delta.y, delta.z);

        const bottomAfter = SPHERE_CENTER.y - radius;

        // Trigger a drop if it entered water this frame
        const surfaceY = 0.0;
        if ((bottomBefore > surfaceY && bottomAfter <= surfaceY) || (bottomBefore <= surfaceY && bottomAfter > surfaceY)) {
            // falling into the water
            water.addDrop(SPHERE_CENTER.x, SPHERE_CENTER.z, radius * 2, 0.01); // larger ripple
        }

        water.displaceVolume(prev, SPHERE_CENTER, radius);

        const minY = radius - 1;
        if (SPHERE_CENTER.y <= minY) {
            SPHERE_CENTER.y = minY;
            this.mesh.position.y = minY;
            this.velocity.y = 0;
            this.mesh.material.uniforms.sphereCenter.value.y = minY;
        }
    }

    private updatePosition(pos: THREE.Vector3): void {
        SPHERE_CENTER.copy(pos);
        this.mesh.position.copy(pos);
        this.mesh.material.uniforms.sphereCenter.value.copy(pos);
    }
}
