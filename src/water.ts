import * as THREE from 'three';
import waterVert from '../shaders/water/vertex.glsl';
import waterFrag from '../shaders/water/fragment.glsl';
import { DIRECTIONAL_LIGHT, params } from '../src/utils/simulationParameters';
import { CUBE_TEXTURE, CAMERA, TILES, FLOOR_COLOR } from './utils/constants';
import { SPHERE_CENTER } from './utils/globals';

export const reflectionRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
});

export const reflectionCamera = CAMERA.clone();
reflectionCamera.layers.set(0); // Only sees default layer (everything except the ball)
reflectionCamera.matrixAutoUpdate = false;
export class Water {
    public geometry;
    public mesh;

    constructor() {
        this.geometry = new THREE.PlaneGeometry(2, 2, 200, 200);

        // I use the Shader material insted of the RAW shader Material, it injets some ommonly used variables such as the projectionmatrix, modelViewMatrix and position

        this.mesh = new THREE.Mesh(
            this.geometry,
            new THREE.ShaderMaterial({
                uniforms: {
                    // float Uniforms, must be manually updated !!!!

                    wallLightAbsorption: new THREE.Uniform(params.wallLightAbsorption),
                    aoStrength: new THREE.Uniform(params.aoStrength),
                    aoFalloffPower: new THREE.Uniform(params.aoFalloffPower),
                    baseLightDiffuse: new THREE.Uniform(params.baseLightDiffuse),
                    causticProjectionScale: new THREE.Uniform(params.causticProjectionScale),
                    causticBoost: new THREE.Uniform(params.causticBoost),

                    uReflectionTex: { value: reflectionRenderTarget.texture },
                    uReflectionMatrix: { value: new THREE.Matrix4() },

                    light: { value: DIRECTIONAL_LIGHT.position },
                    water: { value: null },
                    tiles: { value: FLOOR_COLOR },
                    sky: { value: CUBE_TEXTURE },
                    causticTex: { value: null },
                    underwater: { value: false },
                    eye: { value: null },
                    sphereCenter: new THREE.Uniform(SPHERE_CENTER),
                    sphereRadius: new THREE.Uniform(params.sphereRadius),
                    abovewaterColor: new THREE.Uniform(params.aboveWater),
                    underwaterColor: new THREE.Uniform(params.underWater),
                },
                side: THREE.BackSide,
                vertexShader: waterVert,
                fragmentShader: waterFrag,
            })
        );
    }
    updateUniforms(waterTexture: THREE.Texture, causticsTexture: THREE.Texture): void {
        // Setting up float uniforms
        this.mesh.material.uniforms['wallLightAbsorption'].value = params.wallLightAbsorption;
        this.mesh.material.uniforms['aoStrength'].value = params.aoStrength;
        this.mesh.material.uniforms['aoFalloffPower'].value = params.aoFalloffPower;
        this.mesh.material.uniforms['baseLightDiffuse'].value = params.baseLightDiffuse;
        this.mesh.material.uniforms['causticProjectionScale'].value = params.causticProjectionScale;
        this.mesh.material.uniforms['causticBoost'].value = params.causticBoost;
        this.mesh.material.uniforms['light'].value = DIRECTIONAL_LIGHT.position;

        const vpMatrix = new THREE.Matrix4().multiplyMatrices(reflectionCamera.projectionMatrix, reflectionCamera.matrixWorldInverse);
        this.mesh.material.uniforms.uReflectionMatrix.value.copy(vpMatrix);

        const eyePosition = CAMERA.position;
        const isUnderwater = eyePosition.y < 0;
        this.mesh.material.uniforms['water'].value = waterTexture;
        this.mesh.material.uniforms['causticTex'].value = causticsTexture;
        this.mesh.material.uniforms['sphereRadius'].value = params.sphereRadius;
        this.mesh.material.uniforms['underwater'].value = isUnderwater;
        this.mesh.material.uniforms['sphereCenter'].value = SPHERE_CENTER;
        this.mesh.material.side = isUnderwater ? THREE.FrontSide : THREE.BackSide;
        this.mesh.material.uniforms.eye.value = CAMERA.position.clone();
    }
}
