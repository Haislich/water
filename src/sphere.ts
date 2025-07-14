import * as THREE from 'three';
import sphereVert from '../shaders/sphere/vertex.glsl';
import shpereFrag from '../shaders/sphere/fragment.glsl';
import { LIGHT, SPHERE_CENTER, SPHERE_RADIUS } from './constants';
export class Sphere {
    public geometry;
    public mesh;
    public radius;
    public oldCenter = SPHERE_CENTER.clone();
    public newCenter = SPHERE_CENTER.clone();

    constructor(radius: number = 1) {
        this.radius = SPHERE_RADIUS;
        this.geometry = new THREE.SphereGeometry(radius);
        this.mesh = new THREE.Mesh(
            this.geometry,
            new THREE.ShaderMaterial({
                vertexShader: sphereVert,
                fragmentShader: shpereFrag,
                uniforms: {
                    light: new THREE.Uniform(LIGHT),
                    sphereCenter: new THREE.Uniform(SPHERE_CENTER),
                    sphereRadius: new THREE.Uniform(SPHERE_RADIUS),
                    caustics: new THREE.Uniform(null),
                    water: new THREE.Uniform(null),
                },
            })
            // new THREE.MeshBasicMaterial()
        );

        // this.mesh.visible = false;
    }
    // move(dx: number, dy: number, dz: number): void {
    //     const limit = 1 - this.radius;
    //     const x = Math.max(-limit, Math.min(limit, this.mesh.position.x + dx));
    //     const y = Math.max(-limit, Math.min(limit, this.mesh.position.y + dy));
    //     const z = Math.max(-limit, Math.min(limit, this.mesh.position.z + dz));
    //     this.oldCenter = this.newCenter;
    //     this.newCenter = new THREE.Vector3(x, y, z);
    //     this.mesh.material.uniforms.sphereCenter.value.set(x, y, z);
    // }
    move(dx: number, dy: number, dz: number): THREE.Vector3 {
        const limit = 1 - this.radius;
        const x = Math.max(-limit, Math.min(limit, this.mesh.position.x + dx));
        const y = Math.max(-limit, Math.min(limit, this.mesh.position.y + dy));
        const z = Math.max(-limit, Math.min(limit, this.mesh.position.z + dz));

        const newPos = new THREE.Vector3(x, y, z);
        this.newCenter = newPos;
        this.mesh.material.uniforms.sphereCenter.value.copy(newPos);
        this.mesh.position.copy(newPos);

        return newPos;
    }
}
