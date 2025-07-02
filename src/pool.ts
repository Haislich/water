import * as THREE from 'three';
import poolVert from '../shaders/pool/vertex.glsl';
import poolFrag from '../shaders/pool/fragment.glsl';
import { LIGHT, FLOOR_COLOR } from './constants';

function generateBowlGeometry(radius = 1, segments = 32, heightScale = 1): THREE.BufferGeometry {
    const vertices = [];
    const indices = [];

    for (let y = 0; y <= segments; y++) {
        const v = y / segments;
        const r = v * radius;
        const z = -heightScale * (r * r); // Paraboloid

        for (let x = 0; x <= segments; x++) {
            const u = x / segments;
            const angle = u * Math.PI * 2;
            const px = r * Math.cos(angle);
            const py = r * Math.sin(angle);
            vertices.push(px, py, z);
        }
    }

    for (let y = 0; y < segments; y++) {
        for (let x = 0; x < segments; x++) {
            const a = y * (segments + 1) + x;
            const b = a + 1;
            const c = a + (segments + 1);
            const d = c + 1;

            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals(); // needed for lighting
    return geometry;
}
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
