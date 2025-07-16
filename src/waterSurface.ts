import * as THREE from 'three';
import { DIRECTIONAL_LIGHT, params } from './utils/simulationParameters';
import { CAMERA, CUBE_TEXTURE, FLOOR_COLOR, RENDERER } from './utils/constants';
import { SPHERE_CENTER } from './utils/globals';

import waterVert from '../shaders/water/vertex.glsl';
import waterFrag from '../shaders/water/fragment.glsl';
import causticVert from '../shaders/caustics/vertex.glsl';
import causticFrag from '../shaders/caustics/fragment.glsl';
import simulationVert from '../shaders/simulation/vertex.glsl';
import dropFrag from '../shaders/simulation/drop_fragment.glsl';
import updateFrag from '../shaders/simulation/update_fragment.glsl';
import normalFrag from '../shaders/simulation/normal_fragment.glsl';
import displaceFrag from '../shaders/simulation/displace_fragment.glsl';

export class WaterSurface {
    public mesh: THREE.Mesh;
    private geometry: THREE.PlaneGeometry;
    public simulationGeometry: THREE.PlaneGeometry;

    private simulation: {
        dropMesh: THREE.Mesh;
        normalMesh: THREE.Mesh;
        updateMesh: THREE.Mesh;
        displaceMesh: THREE.Mesh;
        textureA: THREE.WebGLRenderTarget;
        textureB: THREE.WebGLRenderTarget;
        current: THREE.WebGLRenderTarget;
    };

    private caustics: {
        mesh: THREE.Mesh;
        target: THREE.WebGLRenderTarget;
    };

    constructor() {
        this.geometry = new THREE.PlaneGeometry(2, 2, 200, 200);
        this.simulationGeometry = new THREE.PlaneGeometry(2, 2);
        // === VISIBLE WATER MESH ===
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
                    uReflectionTex: { value: null },
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

        // === SIMULATION ===
        const textureOpts = {
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            depthBuffer: true,
            stencilBuffer: false,
        };

        const texA = new THREE.WebGLRenderTarget(256, 256, textureOpts);
        const texB = new THREE.WebGLRenderTarget(256, 256, textureOpts);

        this.simulation = {
            dropMesh: new THREE.Mesh(
                this.simulationGeometry,
                new THREE.RawShaderMaterial({
                    uniforms: {
                        center: { value: [0, 0] },
                        radius: { value: 0 },
                        strength: { value: 0 },
                        texture: { value: null },
                    },
                    vertexShader: simulationVert,
                    fragmentShader: dropFrag,
                })
            ),
            updateMesh: new THREE.Mesh(
                this.simulationGeometry,
                new THREE.RawShaderMaterial({
                    uniforms: { texture: { value: null } },
                    vertexShader: simulationVert,
                    fragmentShader: updateFrag,
                })
            ),
            normalMesh: new THREE.Mesh(
                this.simulationGeometry,
                new THREE.RawShaderMaterial({
                    uniforms: { texture: { value: null } },
                    vertexShader: simulationVert,
                    fragmentShader: normalFrag,
                })
            ),
            displaceMesh: new THREE.Mesh(
                this.simulationGeometry,
                new THREE.RawShaderMaterial({
                    uniforms: {
                        oldCenter: { value: new THREE.Vector3() },
                        newCenter: { value: new THREE.Vector3() },
                        radius: { value: 0 },
                        texture: { value: null },
                    },
                    vertexShader: simulationVert,
                    fragmentShader: displaceFrag,
                })
            ),
            textureA: texA,
            textureB: texB,
            current: texA,
        };

        // === CAUSTICS ===
        this.caustics = {
            mesh: new THREE.Mesh(
                this.geometry,
                new THREE.RawShaderMaterial({
                    uniforms: {
                        causticIntensityScale: new THREE.Uniform(params.causticIntensityScale),
                        shadowBaseSoftness: new THREE.Uniform(params.shadowBaseSoftness),
                        shadowDistanceScale: new THREE.Uniform(params.shadowDistanceScale),
                        shadowDistanceMixScale: new THREE.Uniform(params.shadowDistanceMixScale),
                        rimShadowSteepness: new THREE.Uniform(params.rimShadowSteepness),
                        rimShadowSlopeScale: new THREE.Uniform(params.rimShadowSlopeScale),
                        rimShadowVerticalOffset: new THREE.Uniform(params.rimShadowVerticalOffset),
                        sphereCenter: new THREE.Uniform(SPHERE_CENTER),
                        sphereRadius: new THREE.Uniform(params.sphereRadius),
                        wallLightAbsorption: new THREE.Uniform(params.wallLightAbsorption),
                        light: new THREE.Uniform(DIRECTIONAL_LIGHT.position),
                        water: new THREE.Uniform(null),
                    },
                    vertexShader: causticVert,
                    fragmentShader: causticFrag,
                })
            ),
            target: new THREE.WebGLRenderTarget(200, 200, { type: THREE.FloatType }),
        };
    }

    public get texture(): THREE.Texture {
        return this.simulation.current.texture;
    }

    public get causticsTexture(): THREE.Texture {
        return this.caustics.target.texture;
    }

    public step(): void {
        this._render(this.simulation.updateMesh);
        this._render(this.simulation.normalMesh);
        this.updateCaustics();
        this.updateWaterUniforms();
    }

    public addDrop(x: number, y: number, radius: number, strength: number): void {
        const mat = this.simulation.dropMesh.material as THREE.Material;
        mat.uniforms['center'].value = [x, y];
        mat.uniforms['radius'].value = radius;
        mat.uniforms['strength'].value = strength;
        this._render(this.simulation.dropMesh);
    }

    public displaceVolume(oldCenter: THREE.Vector3, newCenter: THREE.Vector3, radius: number): void {
        const mat = this.simulation.displaceMesh.material;
        mat.uniforms['oldCenter'].value.copy(oldCenter);
        mat.uniforms['newCenter'].value.copy(newCenter);
        mat.uniforms['radius'].value = radius;
        this._render(this.simulation.displaceMesh);
    }

    private updateCaustics(): void {
        const mat = this.caustics.mesh.material;
        mat.uniforms['water'].value = this.texture;
        mat.uniforms['sphereRadius'].value = params.sphereRadius;
        mat.uniforms['wallLightAbsorption'].value = params.wallLightAbsorption;

        RENDERER.setRenderTarget(this.caustics.target);
        RENDERER.setClearColor(new THREE.Color('black'), 1);
        RENDERER.clear();
        RENDERER.render(this.caustics.mesh, CAMERA);
        RENDERER.setRenderTarget(null);
    }

    private updateWaterUniforms(): void {
        const mat = this.mesh.material;
        const isUnderwater = CAMERA.position.y < 0;
        // const vpMatrix = new THREE.Matrix4().multiplyMatrices(reflectionCamera.projectionMatrix, reflectionCamera.matrixWorldInverse);

        // mat.uniforms.uReflectionMatrix.value.copy(vpMatrix);
        mat.uniforms.eye.value = CAMERA.position.clone();
        mat.uniforms.underwater.value = isUnderwater;
        mat.uniforms.water.value = this.texture;
        mat.uniforms.causticTex.value = this.causticsTexture;
        mat.uniforms.sphereCenter.value = SPHERE_CENTER;
        mat.uniforms.sphereRadius.value = params.sphereRadius;

        mat.side = isUnderwater ? THREE.FrontSide : THREE.BackSide;
    }

    private _render(mesh: THREE.Mesh): void {
        const old = this.simulation.current;
        const next = old === this.simulation.textureA ? this.simulation.textureB : this.simulation.textureA;

        (mesh.material as THREE.ShaderMaterial).uniforms['texture'].value = old.texture;

        RENDERER.setRenderTarget(next);
        RENDERER.render(mesh, CAMERA);
        RENDERER.setRenderTarget(null);

        this.simulation.current = next;
    }
}
