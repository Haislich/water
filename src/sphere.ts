import * as THREE from 'three';
import sphereVert from '../shaders/sphere/vertex.glsl';
import shpereFrag from '../shaders/sphere/fragment.glsl';
import { LIGHT } from './constants';
export class Sphere {
    public geometry;
    public mesh;
    constructor(radius: number = 0.5) {
        this.geometry = new THREE.SphereGeometry(radius);
        this.mesh = new THREE.Mesh(
            this.geometry,
            new THREE.ShaderMaterial({
                vertexShader: sphereVert,
                fragmentShader: shpereFrag,
                uniforms: {
                    light: new THREE.Uniform(LIGHT),
                    sphereCenter: new THREE.Uniform(new THREE.Vector3(0, 0, 0)),
                    sphereRadius: new THREE.Uniform(radius),
                    caustics: new THREE.Uniform(null),
                    water: new THREE.Uniform(null),
                },
            })
        );
        // this.mesh.visible = false;
    }
}
