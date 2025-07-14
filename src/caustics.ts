import * as THREE from 'three';
import causticVert from '../shaders/caustics/vertex.glsl';
import causticFrag from '../shaders/caustics/fragment.glsl';
import { CAMERA, RENDERER } from './utils/constants';
import { SPHERE_CENTER } from './utils/globals';
import { DIRECTIONAL_LIGHT, params } from './utils/simulationParameters';

export class Caustics {
    private geometry;
    private causticMesh;
    private _texture;
    constructor(lightFrontGeometry: THREE.PlaneGeometry) {
        this.geometry = lightFrontGeometry;

        this._texture = new THREE.WebGLRenderTarget(200, 200, {
            type: THREE.FloatType,
        });

        const material = new THREE.RawShaderMaterial({
            uniforms: {
                light: { value: DIRECTIONAL_LIGHT.position },
                water: { value: null },
                sphereCenter: new THREE.Uniform(SPHERE_CENTER),
                sphereRadius: new THREE.Uniform(params.sphereRadius),
                wallLightAbsorption: new THREE.Uniform(params.wallLightAbsorption),
            },
            vertexShader: causticVert,
            fragmentShader: causticFrag,
        });

        this.causticMesh = new THREE.Mesh(this.geometry, material);
    }
    get texture(): THREE.Texture {
        return this._texture.texture;
    }

    update(waterTexture: THREE.Texture): void {
        this.causticMesh.material.uniforms['water'].value = waterTexture;
        this.causticMesh.material.uniforms['sphereRadius'].value = params.sphereRadius;
        this.causticMesh.material.uniforms['wallLightAbsorption'].value = params.wallLightAbsorption;

        // Bind the current texture
        RENDERER.setRenderTarget(this._texture);
        // commented because I don't get what's going on
        RENDERER.setClearColor(new THREE.Color('black'), 1);
        // clear the current frame buffer
        RENDERER.clear();
        //actually make computarions on the mesh, so this calls the shaders (?)
        RENDERER.render(this.causticMesh, CAMERA);
        // unbind the texture
        RENDERER.setRenderTarget(null);
    }
}
