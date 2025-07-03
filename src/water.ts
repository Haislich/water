import * as THREE from 'three';
import waterVert from '../shaders/water/vertex.glsl';
import waterFrag from '../shaders/water/fragment.glsl';
import { CAMERA, CUBE_TEXTURE, LIGHT, FLOOR_COLOR, TILES } from './constants';
export class Water {
    public geometry;
    public material;
    public aboveWaterMesh;
    public underWaterMesh;
    constructor() {
        this.geometry = new THREE.PlaneGeometry(2, 2, 200, 200);

        // I use the Shader material insted of the RAW shader Material, it injets some ommonly used variables such as the projectionmatrix, modelViewMatrix and position

        this.aboveWaterMesh = new THREE.Mesh(
            this.geometry,
            new THREE.ShaderMaterial({
                uniforms: {
                    light: { value: LIGHT },
                    tiles: { value: FLOOR_COLOR },
                    sky: { value: CUBE_TEXTURE },
                    water: { value: null },
                    causticTex: { value: null },
                    underwater: { value: false },
                },
                side: THREE.BackSide,
                vertexShader: waterVert,
                fragmentShader: waterFrag,
                // transparent: true,
            })
        );
        this.underWaterMesh = new THREE.Mesh(
            this.geometry,
            new THREE.ShaderMaterial({
                uniforms: {
                    light: { value: LIGHT },
                    tiles: { value: TILES },
                    sky: { value: CUBE_TEXTURE },
                    water: { value: null },
                    causticTex: { value: null },
                    underwater: { value: true },
                },
                side: THREE.FrontSide,
                vertexShader: waterVert,
                fragmentShader: waterFrag,
                // transparent: true,
            })
        );
    }
    updateUniforms(waterTexture: THREE.Texture, causticsTexture: THREE.Texture): void {
        // const eyePosition = CAMERA.position;
        // const isUnderwater = eyePosition.y < 0;
        this.aboveWaterMesh.material.uniforms['water'].value = waterTexture;
        this.aboveWaterMesh.material.uniforms['causticTex'].value = causticsTexture;

        this.underWaterMesh.material.uniforms['water'].value = waterTexture;
        this.underWaterMesh.material.uniforms['causticTex'].value = causticsTexture;
    }
}
