import * as THREE from 'three';
import waterVert from '../shaders/water/vertex.glsl';
import waterFrag from '../shaders/water/fragment.glsl';
import { DIRECTIONAL_LIGHT, params } from '../src/utils/simulationParameters';
import { CAMERA, FLOOR_COLOR, RENDERER } from './utils/constants';
import type { WaterSimulation } from './waterSimulation';
import type { Caustics } from './caustics';
import type { Sphere } from './sphere';

export class Water {
    public geometry;
    public mesh;
    public cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
        format: THREE.RGBAFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        colorSpace: THREE.SRGBColorSpace,
    });

    public cubeCamera = new THREE.CubeCamera(0.1, 1000, this.cubeRenderTarget);

    constructor(waterSimulation: WaterSimulation, caustics: Caustics) {
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

                    light: { value: DIRECTIONAL_LIGHT.position },
                    water: { value: waterSimulation.texture },
                    tiles: { value: FLOOR_COLOR },
                    sky: { value: this.cubeRenderTarget.texture },
                    causticTex: { value: caustics.texture },
                    underwater: { value: false },
                    eye: { value: null },
                    sphereCenter: new THREE.Uniform(null),
                    sphereRadius: new THREE.Uniform(params.sphereRadius),
                    abovewaterColor: new THREE.Uniform(params.aboveWater),
                    underwaterColor: new THREE.Uniform(params.underWater),
                },
                side: THREE.BackSide,
                vertexShader: waterVert,
                fragmentShader: waterFrag,
            })
        );
        this.mesh.receiveShadow = true;
    }
    updateUniforms(waterSimulation: WaterSimulation, caustics: Caustics, sphere: Sphere): void {
        // Setting up float uniforms
        this.mesh.material.uniforms['wallLightAbsorption'].value = params.wallLightAbsorption;
        this.mesh.material.uniforms['aoStrength'].value = params.aoStrength;
        this.mesh.material.uniforms['aoFalloffPower'].value = params.aoFalloffPower;
        this.mesh.material.uniforms['baseLightDiffuse'].value = params.baseLightDiffuse;
        this.mesh.material.uniforms['causticProjectionScale'].value = params.causticProjectionScale;
        this.mesh.material.uniforms['causticBoost'].value = params.causticBoost;
        this.mesh.material.uniforms['light'].value = DIRECTIONAL_LIGHT.position;

        const eyePosition = CAMERA.position;
        const isUnderwater = eyePosition.y < 0;
        this.mesh.material.uniforms['water'].value = waterSimulation.texture;
        this.mesh.material.uniforms['causticTex'].value = caustics.texture;
        this.mesh.material.uniforms['sphereRadius'].value = params.sphereRadius;
        this.mesh.material.uniforms['underwater'].value = isUnderwater;
        this.mesh.material.uniforms['sphereCenter'].value = sphere.center;
        this.mesh.material.side = isUnderwater ? THREE.FrontSide : THREE.BackSide;
        this.mesh.material.uniforms.eye.value = CAMERA.position.clone();
    }

    updateReflection(scene: THREE.Scene): void {
        this.mesh.visible = false; // hide water to avoid reflecting itself
        this.cubeCamera.update(RENDERER, scene);
        this.mesh.visible = true;
    }
}
