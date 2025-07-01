import * as THREE from 'three';
import waterVert from '../shaders/water/vertex.glsl';
import waterFrag from '../shaders/water/fragment.glsl';
import { CAMERA, CUBE_TEXTURE, LIGHT, RENDERER, TILES } from './constants';
export class Water {
    public geometry;
    public material;
    public mesh;
    constructor() {
        this.geometry = new THREE.PlaneGeometry(2, 2, 200, 200);

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                light: { value: LIGHT },
                tiles: { value: TILES },
                sky: { value: CUBE_TEXTURE },
                water: { value: null },
                causticTex: { value: null },
                underwater: { value: false },
            },
            vertexShader: waterVert,
            fragmentShader: waterFrag,
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

    draw(waterTexture: THREE.Texture, causticsTexture: THREE.Texture): void {
        this.material.uniforms['water'].value = waterTexture;
        this.material.uniforms['causticTex'].value = causticsTexture;

        this.material.side = THREE.FrontSide;
        this.material.uniforms['underwater'].value = true;

        RENDERER.render(this.mesh, CAMERA);

        this.material.side = THREE.BackSide;
        this.material.uniforms['underwater'].value = false;
        RENDERER.render(this.mesh, CAMERA);
    }
}
