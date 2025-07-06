import * as THREE from 'three';
import poolVert from '../shaders/pool/vertex.glsl';
import poolFrag from '../shaders/pool/fragment.glsl';
import { LIGHT, FLOOR_COLOR } from './constants';

export class Pool {
    private geometry;
    private material;
    public mesh;
    constructor() {
        this.geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, -1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, 1,
            -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1,
        ]);
        const indices = new Uint32Array([0, 1, 2, 2, 1, 3, 4, 5, 6, 6, 5, 7, 12, 13, 14, 14, 13, 15, 16, 17, 18, 18, 17, 19, 20, 21, 22, 22, 21, 23]);

        this.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                light: { value: LIGHT },
                tiles: { value: FLOOR_COLOR },
                water: { value: null },
                causticTex: { value: null },
            },
            vertexShader: poolVert,
            fragmentShader: poolFrag,
        });
        this.material.side = THREE.FrontSide;

        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }
    updateUniforms(waterTexture: THREE.Texture, causticsTexture: THREE.Texture): void {
        this.material.uniforms['water'].value = waterTexture;
        this.material.uniforms['causticTex'].value = causticsTexture;
    }
}
