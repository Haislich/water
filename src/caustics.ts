import * as THREE from 'three';
import causticVert from '../shaders/caustics/vertex.glsl';
import causticFrag from '../shaders/caustics/fragment.glsl';
import { CAMERA, RENDERER } from './utils/constants';
import { SPHERE_CENTER } from './utils/globals';
import { DIRECTIONAL_LIGHT, params } from './utils/simulationParameters';

export class Caustics {
    private geometry: THREE.PlaneGeometry;
    private causticMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.RawShaderMaterial>;
    private _renderTarget;
    constructor(lightFrontGeometry: THREE.PlaneGeometry) {
        this.geometry = lightFrontGeometry;

        this._renderTarget = new THREE.WebGLRenderTarget(200, 200, {
            type: THREE.FloatType,
        });

        const material = new THREE.RawShaderMaterial({
            uniforms: {
                sphereCenter: new THREE.Uniform(SPHERE_CENTER),
                sphereRadius: new THREE.Uniform(params.sphereRadius),
                wallLightAbsorption: new THREE.Uniform(params.wallLightAbsorption),
                light: new THREE.Uniform(DIRECTIONAL_LIGHT.position),
                water: new THREE.Uniform(null),
            },
            vertexShader: causticVert,
            fragmentShader: causticFrag,
        });

        this.causticMesh = new THREE.Mesh(this.geometry, material);
    }
    get texture(): THREE.Texture {
        return this._renderTarget.texture;
    }

    updateUniforms(waterTexture: THREE.Texture): void {
        this.causticMesh.material.uniforms['water'].value = waterTexture;
        this.causticMesh.material.uniforms['sphereRadius'].value = params.sphereRadius;
        this.causticMesh.material.uniforms['wallLightAbsorption'].value = params.wallLightAbsorption;

        // Bind the current texture
        RENDERER.setRenderTarget(this._renderTarget);
        // commented because I don't get what's going on
        RENDERER.setClearColor(new THREE.Color('black'), 1);
        // clear the current frame buffer
        RENDERER.clear();
        // Render the caustic mesh into the render target, triggering shader computation
        RENDERER.render(this.causticMesh, CAMERA);
        // unbind the texture
        RENDERER.setRenderTarget(null);
    }
}
