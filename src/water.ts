import * as THREE from 'three';
import waterVert from '../shaders/water/vertex.glsl';
import waterFrag from '../shaders/water/fragment.glsl';
import { CUBE_TEXTURE, LIGHT, FLOOR_COLOR, CAMERA } from './constants';
export class Water {
    public geometry;
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
                    water: { value: null },
                    tiles: { value: FLOOR_COLOR },
                    sky: { value: CUBE_TEXTURE },
                    causticTex: { value: null },
                    underwater: { value: false },
                    eye: { value: CAMERA.position.clone() },
                },
                side: THREE.BackSide,
                vertexShader: waterVert,
                fragmentShader: waterFrag,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending,
            })
        );
        this.underWaterMesh = new THREE.Mesh(
            this.geometry,
            new THREE.ShaderMaterial({
                uniforms: {
                    light: { value: LIGHT },
                    water: { value: null },
                    tiles: { value: FLOOR_COLOR },
                    sky: { value: CUBE_TEXTURE },
                    causticTex: { value: null },
                    underwater: { value: true },
                    eye: { value: CAMERA.position.clone() },
                },
                side: THREE.FrontSide,
                vertexShader: waterVert,
                fragmentShader: waterFrag,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending,
            })
        );
    }
    updateUniforms(waterTexture: THREE.Texture, causticsTexture: THREE.Texture): void {
        // const eyePosition = CAMERA.position;
        // const isUnderwater = eyePosition.y < 0;
        this.aboveWaterMesh.material.uniforms['water'].value = waterTexture;
        this.aboveWaterMesh.material.uniforms['causticTex'].value = causticsTexture;
        this.aboveWaterMesh.material.uniforms.eye.value = CAMERA.position.clone();

        this.underWaterMesh.material.uniforms['water'].value = waterTexture;
        this.underWaterMesh.material.uniforms['causticTex'].value = causticsTexture;
        this.underWaterMesh.material.uniforms.eye.value = CAMERA.position.clone();
    }
}
