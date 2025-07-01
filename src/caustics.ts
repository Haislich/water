import * as THREE from 'three';
import causticVert from '../shaders/caustics/vertex.glsl';
import causticFrag from '../shaders/caustics/fragment.glsl';
import { CAMERA, LIGHT, RENDERER } from './constants';

export class Caustics {
    private camera;
    private geometry;
    private causticMesh;
    public texture;
    constructor(lightFrontGeometry: THREE.PlaneGeometry) {
        this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 2000);

        this.geometry = lightFrontGeometry;

        this.texture = new THREE.WebGLRenderTarget(1024, 1024, {
            type: THREE.FloatType,
        });

        const material = new THREE.RawShaderMaterial({
            uniforms: {
                light: { value: LIGHT },
                water: { value: null },
            },
            vertexShader: causticVert,
            fragmentShader: causticFrag,
        });

        this.causticMesh = new THREE.Mesh(this.geometry, material);
        this.causticMesh.scale.setScalar(2);
    }

    update(waterTexture) {
        // console.log(waterTexture);
        this.causticMesh.material.uniforms['water'].value = waterTexture;

        RENDERER.setRenderTarget(this.texture);
        RENDERER.setClearColor(new THREE.Color('black'), 0);
        RENDERER.clear();
        RENDERER.render(this.causticMesh, CAMERA);
    }
}
