import * as THREE from 'three';
import sphereVert from '../shaders/sphere/vertex.glsl';
import shpereFrag from '../shaders/sphere/fragment.glsl';
import { SPHERE_CENTER } from './utils/globals';
import { params, DIRECTIONAL_LIGHT } from './utils/simulationParameters';
import type { WaterSimulation } from './waterSimulation';
export class Sphere {
    public geometry;
    public mesh;
    public oldCenter = SPHERE_CENTER.clone();
    public newCenter = SPHERE_CENTER.clone();
    public velocity = new THREE.Vector3();
    public mass: number;
    public gravity = new THREE.Vector3(0, -4, 0);
    public usePhysics = false;

    constructor(mass: number = 1) {
        this.mass = mass;
        this.geometry = new THREE.SphereGeometry();
        this.mesh = new THREE.Mesh(
            this.geometry,
            new THREE.ShaderMaterial({
                vertexShader: sphereVert,
                fragmentShader: shpereFrag,
                uniforms: {
                    light: new THREE.Uniform(DIRECTIONAL_LIGHT.position),
                    sphereCenter: new THREE.Uniform(SPHERE_CENTER),
                    sphereRadius: new THREE.Uniform(params.sphereRadius),
                    caustics: new THREE.Uniform(null),
                    water: new THREE.Uniform(null),
                    underwaterColor: new THREE.Uniform(params.underWater),
                },
            })
            // new THREE.MeshBasicMaterial()
        );

        // this.mesh.visible = false;
    }
    updateUniforms(waterSimulationTexture: THREE.Texture, causticsTexture: THREE.Texture): void {
        this.mesh.material.uniforms.caustics.value = causticsTexture;
        this.mesh.material.uniforms.water.value = waterSimulationTexture;
        this.mesh.material.uniforms.sphereRadius.value = params.sphereRadius;
    }
    move(dx: number, dy: number, dz: number): THREE.Vector3 {
        const limit = 1 - params.sphereRadius;
        const x = Math.max(-limit, Math.min(limit, this.mesh.position.x + dx));
        const y = this.mesh.position.y + dy;
        const z = Math.max(-limit, Math.min(limit, this.mesh.position.z + dz));
        this.oldCenter = SPHERE_CENTER.clone();
        const newPos = new THREE.Vector3(x, y, z);
        // this.newCenter = newPos;
        SPHERE_CENTER.copy(newPos);
        this.mesh.material.uniforms.sphereCenter.value.copy(newPos);
        this.mesh.position.copy(newPos);

        return newPos;
    }
    updatePhysics(deltaTime: number, water: WaterSimulation): void {
        // How submerged the center of the sphere is
        const percentUnderwater = Math.max(0, Math.min(1, (params.sphereRadius - SPHERE_CENTER.y) / (2 * params.sphereRadius)));

        // Gravity scaled by underwater resistance
        const adjustedGravity = this.gravity.clone().multiplyScalar(deltaTime * (1 - 1.1 * percentUnderwater));
        this.velocity.add(adjustedGravity);

        // Extra damping due to viscosity under water
        const speed = this.velocity.length();
        if (speed > 0.0001) {
            const drag = this.velocity
                .clone()
                .normalize()
                .multiplyScalar(percentUnderwater * deltaTime * speed * speed);
            this.velocity.sub(drag);
        }

        // Move the sphere
        const delta = this.velocity.clone().multiplyScalar(deltaTime);
        const prev = SPHERE_CENTER.clone();
        this.move(delta.x, delta.y, delta.z);
        water.displaceVolume(prev, SPHERE_CENTER, params.sphereRadius);
        this.oldCenter.copy(prev);

        // Bounce off the bottom
        const minY = params.sphereRadius - 1;
        if (SPHERE_CENTER.y < minY) {
            SPHERE_CENTER.y = minY;
            this.velocity.y = Math.abs(this.velocity.y) * 0.7;
            this.mesh.position.y = minY;
            this.mesh.material.uniforms.sphereCenter.value.y = minY;
        }
    }
}
