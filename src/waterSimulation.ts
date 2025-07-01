import * as THREE from 'three';

import simulationVert from '../shaders/simulation/vertex.glsl';
import dropFrag from '../shaders/simulation/drop_fragment.glsl';
import updateFrag from '../shaders/simulation/update_fragment.glsl';
import normalFrag from '../shaders/simulation/normal_fragment.glsl';

export class WaterSimulation {
    private camera;
    private geometry;
    private textureA;
    private textureB;
    public texture;
    public dropMesh;
    public normalMesh;
    public updateMesh;
    constructor() {
        this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 2000);

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
        this.texture = this.textureA;

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
                delta: { value: [1 / 256, 1 / 256] }, // TODO: Remove this useless uniform and hardcode it in shaders?
                texture: { value: null },
            },
            vertexShader: simulationVert,
            fragmentShader: normalFrag,
        });

        const updateMaterial = new THREE.RawShaderMaterial({
            uniforms: {
                delta: { value: [1 / 256, 1 / 256] }, // TODO: Remove this useless uniform and hardcode it in shaders?
                texture: { value: null },
            },
            vertexShader: simulationVert,
            fragmentShader: updateFrag,
        });

        this.dropMesh = new THREE.Mesh(this.geometry, dropMaterial);
        this.normalMesh = new THREE.Mesh(this.geometry, normalMaterial);
        this.updateMesh = new THREE.Mesh(this.geometry, updateMaterial);
    }

    // Add a drop of water at the (x, y) coordinate (in the range [-1, 1])
    addDrop(renderer, x, y, radius, strength) {
        this.dropMesh.material.uniforms['center'].value = [x, y];
        this.dropMesh.material.uniforms['radius'].value = radius;
        this.dropMesh.material.uniforms['strength'].value = strength;

        this._render(renderer, this.dropMesh);
    }

    stepSimulation(renderer) {
        this._render(renderer, this.updateMesh);
    }

    updateNormals(renderer) {
        this._render(renderer, this.normalMesh);
    }

    _render(renderer: THREE.WebGLRenderer, mesh: THREE.Mesh) {
        // Swap textures
        const oldTexture = this.texture;
        const newTexture = this.texture === this.textureA ? this.textureB : this.textureA;

        mesh.material.uniforms['texture'].value = oldTexture.texture;

        renderer.setRenderTarget(newTexture);

        renderer.render(mesh, this.camera);

        this.texture = newTexture;
    }
}
