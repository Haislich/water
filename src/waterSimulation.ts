import * as THREE from 'three';

import simulationVert from '../shaders/simulation/vertex.glsl';
import dropFrag from '../shaders/simulation/drop_fragment.glsl';
import updateFrag from '../shaders/simulation/update_fragment.glsl';
import normalFrag from '../shaders/simulation/normal_fragment.glsl';
import displaceFrag from '../shaders/simulation/displace_fragment.glsl';

import { CAMERA, RENDERER } from './utils/constants';

export class WaterSimulation {
    private geometry;
    private textureA;
    private textureB;
    private _texture;
    public dropMesh;
    public normalMesh;
    public updateMesh;
    public displaceMesh;
    // public sphereMesh;
    constructor() {
        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.textureA = new THREE.WebGLRenderTarget(256, 256, {
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            depthBuffer: true,
            stencilBuffer: false,
        });
        this.textureB = new THREE.WebGLRenderTarget(256, 256, {
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            depthBuffer: true,
            stencilBuffer: false,
        });
        this._texture = this.textureA;

        const dropMaterial = new THREE.RawShaderMaterial({
            uniforms: {
                center: { value: [0, 0] },
                radius: { value: 0 },
                strength: { value: 0 },
                texture: { value: null },
            },
            vertexShader: simulationVert,
            fragmentShader: dropFrag,
        });

        const normalMaterial = new THREE.RawShaderMaterial({
            uniforms: {
                texture: { value: null },
            },
            vertexShader: simulationVert,
            fragmentShader: normalFrag,
        });

        const updateMaterial = new THREE.RawShaderMaterial({
            uniforms: {
                texture: { value: null },
            },
            vertexShader: simulationVert,
            fragmentShader: updateFrag,
        });
        const displaceMaterial = new THREE.RawShaderMaterial({
            uniforms: {
                oldCenter: { value: new THREE.Vector3() },
                newCenter: { value: new THREE.Vector3() },
                radius: { value: 0 },
                texture: { value: null },
            },
            vertexShader: simulationVert,
            fragmentShader: displaceFrag,
        });

        this.dropMesh = new THREE.Mesh(this.geometry, dropMaterial);
        this.normalMesh = new THREE.Mesh(this.geometry, normalMaterial);
        this.updateMesh = new THREE.Mesh(this.geometry, updateMaterial);
        this.displaceMesh = new THREE.Mesh(this.geometry, displaceMaterial);
    }
    get texture(): THREE.Texture {
        return this._texture.texture;
    }
    // Add a drop of water at the (x, y) coordinate (in the range [-1, 1])
    addDrop(x: number, y: number, radius: number, strength: number): void {
        this.dropMesh.material.uniforms['center'].value = [x, y];
        this.dropMesh.material.uniforms['radius'].value = radius;
        this.dropMesh.material.uniforms['strength'].value = strength;

        this._render(this.dropMesh);
    }

    stepSimulation(): void {
        this._render(this.updateMesh);
    }

    updateNormals(): void {
        this._render(this.normalMesh);
    }
    displaceVolume(oldCenter: THREE.Vector3, newCenter: THREE.Vector3, radius: number): void {
        const material = this.displaceMesh.material;
        material.uniforms['oldCenter'].value.copy(oldCenter);
        material.uniforms['newCenter'].value.copy(newCenter);
        material.uniforms['radius'].value = radius;

        this._render(this.displaceMesh);
    }

    _render(mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.RawShaderMaterial>): void {
        // Swap textures
        const oldTexture = this._texture;
        const newTexture = this._texture === this.textureA ? this.textureB : this.textureA;

        mesh.material.uniforms['texture'].value = oldTexture.texture;

        RENDERER.setRenderTarget(newTexture);

        RENDERER.render(mesh, CAMERA);

        this._texture = newTexture;
        RENDERER.setRenderTarget(null);
    }
}
