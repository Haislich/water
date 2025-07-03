import * as THREE from 'three';
import smokeVert from '../shaders/smoke/vertex.glsl';
import smokeFrag from '../shaders/smoke/fragment.glsl';
import { NOISE_TEXTURE } from './constants';
export class Smoke {
    public mesh;
    constructor() {
        this.mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 2, 16, 64),
            new THREE.ShaderMaterial({
                vertexShader: smokeVert,
                fragmentShader: smokeFrag,
                side: THREE.DoubleSide,
                transparent: true,
                uniforms: {
                    uTime: new THREE.Uniform(0),
                    uNoiseTexture: new THREE.Uniform(NOISE_TEXTURE),
                },
            })
        );
        // this.mesh.rotation.y = Math.random() * 2 * Math.PI;

        this.mesh.position.y += 1;
        this.mesh.position.x = Math.random() - 0.5;
    }
}
