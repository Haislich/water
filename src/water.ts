import * as THREE from 'three';
import waterVert from '../shaders/water/vertex.glsl';
import waterFrag from '../shaders/water/fragment.glsl';
import { DIRECTIONAL_LIGHT, params } from '../src/utils/simulationParameters';
import { CUBE_TEXTURE, CAMERA, FLOOR_COLOR } from './utils/constants';
import { SPHERE_CENTER } from './utils/globals';

export const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    colorSpace: THREE.SRGBColorSpace,
});

export const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);

export class Water {
    public geometry;
    public mesh;

    constructor() {
        this.geometry = new THREE.PlaneGeometry(2, 2, 200, 200);
        this.mesh = new THREE.Mesh(
            this.geometry,
            new THREE.ShaderMaterial({
                uniforms: {
                    wallLightAbsorption: new THREE.Uniform(params.wallLightAbsorption),
                    aoStrength: new THREE.Uniform(params.aoStrength),
                    aoFalloffPower: new THREE.Uniform(params.aoFalloffPower),
                    baseLightDiffuse: new THREE.Uniform(params.baseLightDiffuse),
                    causticProjectionScale: new THREE.Uniform(params.causticProjectionScale),
                    causticBoost: new THREE.Uniform(params.causticBoost),

                    // uReflectionTex: { value: CUBE_TEXTURE },
                    uReflectionTex: { value: cubeRenderTarget.texture },

                    uReflectionMatrix: { value: new THREE.Matrix4() },

                    light: { value: DIRECTIONAL_LIGHT.position },
                    water: { value: null },
                    tiles: { value: FLOOR_COLOR },
                    sky: { value: cubeRenderTarget.texture },
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
        this.mesh.material.uniforms.uReflectionTex.value = cubeRenderTarget.texture;

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
