import * as THREE from 'three';
import causticVert from '../shaders/caustics/vertex.glsl';
import causticFrag from '../shaders/caustics/fragment.glsl';

export class Caustics {
    private camera;
    private geometry;
    private causticMesh;
    public texture;
    constructor(lightFrontGeometry) {
        this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 2000);

        this.geometry = lightFrontGeometry;

        this.texture = new THREE.WebGLRenderTarget(1024, 1024, {
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            depthBuffer: true,
            stencilBuffer: false,
        });
        this.texture.texture.internalFormat = 'RGBA';

        const material = new THREE.RawShaderMaterial({
            uniforms: {
                // light: { value: light },
                water: { value: null },
            },
            vertexShader: causticVert,
            fragmentShader: causticFrag,
        });

        this.causticMesh = new THREE.Mesh(this.geometry, material);
    }

    update(renderer, waterTexture) {
        // console.log(waterTexture);
        this.causticMesh.material.uniforms['water'].value = waterTexture;

        renderer.setRenderTarget(this.texture);
        renderer.setClearColor(new THREE.Color('black'), 0);
        renderer.clear();

        // TODO Camera is useless here, what should be done?
        renderer.render(this.causticMesh, this.camera);
    }
}
