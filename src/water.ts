import * as THREE from 'three';
import waterVert from '../shaders/water/vertex.glsl';
import waterFrag from '../shaders/water/fragment.glsl';
import { params } from '../src/utils/simulationParameters';
import { CUBE_TEXTURE, LIGHT, FLOOR_COLOR, CAMERA, TILES, SPHERE_CENTER } from './constants';
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
                    light: { value: LIGHT },
                    water: { value: null },
                    tiles: { value: TILES },
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
        const eyePosition = CAMERA.position;
        const isUnderwater = eyePosition.y < 0;
        this.mesh.material.uniforms['water'].value = waterTexture;
        this.mesh.material.uniforms['causticTex'].value = causticsTexture;
        this.mesh.material.uniforms.sphereRadius.value = params.sphereRadius;
        this.mesh.material.uniforms.underwater.value = isUnderwater;
        this.mesh.material.side = isUnderwater ? THREE.FrontSide : THREE.BackSide;
        this.mesh.material.uniforms.eye.value = CAMERA.position.clone();
    }
}
