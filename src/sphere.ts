import * as THREE from 'three';
import sphereVert from '../shaders/sphere/vertex.glsl';
import shpereFrag from '../shaders/sphere/fragment.glsl';
import { LIGHT, SPHERE_CENTER, SPHERE_RADIUS } from './constants';
export class Sphere {
    public geometry;
    public mesh;
    constructor(radius: number = 1) {
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
}
