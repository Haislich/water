import * as THREE from 'three';
import smokeVert from '../shaders/smoke/vertex.glsl';
import smokeFrag from '../shaders/smoke/fragment.glsl';
import { NOISE_TEXTURE } from './utils/constants';
export class Smoke {
    public mesh;
    constructor(width: number = 1, height: number = 2) {
        this.mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height, 16, 64),
            new THREE.ShaderMaterial({
                vertexShader: smokeVert,
                fragmentShader: smokeFrag,
                side: THREE.DoubleSide,
                transparent: true,
                uniforms: {
                    uTime: new THREE.Uniform(Math.random()),
                    uPerlinNoise: new THREE.Uniform(NOISE_TEXTURE),
                },
                depthWrite: false,
            })
        );
        this.mesh.rotation.y = Math.random() * 2 * Math.PI;
        this.mesh.position.y += height / 2;
        this.mesh.position.x -= width / 2;
    }
    updateUniforms(uTime: number): void {
        this.mesh.material.uniforms['uTime'].value = uTime;
    }
}
