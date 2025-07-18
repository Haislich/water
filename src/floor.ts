import * as THREE from 'three';
import { FLOOR_ARM, FLOOR_COLOR, FLOOR_DISPLACEMENT, FLOOR_NORMAL } from './utils/constants';

const generateGaussianSquareHoleAlphaMap = (size: number = 512, squareRatio: number = 0.3): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const center = size / 2;
    const squareSize = size * squareRatio;
    const halfSquare = squareSize / 2;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - center;
            const dy = y - center;

            const index = (y * size + x) * 4;
            const inside = Math.abs(dx) < halfSquare && Math.abs(dy) < halfSquare;

            const alpha = inside ? 0 : 255;

            data[index + 0] = 255;
            data[index + 1] = 255;
            data[index + 2] = 255;
            data[index + 3] = alpha;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    return texture;
};

const POOL_SIZE = 2.001;

export class Floor {
    public mesh;
    constructor(outerSize: number = 50) {
        const ALPHA_MAP = generateGaussianSquareHoleAlphaMap(
            4096,
            POOL_SIZE / outerSize // so square matches world scale
        );
        const geometry = new THREE.PlaneGeometry(outerSize, outerSize, outerSize * 10, outerSize * 10);

        const material = new THREE.MeshStandardMaterial({
            alphaMap: ALPHA_MAP,
            transparent: true,
            map: FLOOR_COLOR,
            aoMap: FLOOR_ARM,
            roughnessMap: FLOOR_ARM,
            metalnessMap: FLOOR_ARM,
            normalMap: FLOOR_NORMAL,
            // side: THREE.DoubleSide,
            displacementMap: FLOOR_DISPLACEMENT,
            displacementScale: 0.3,
            displacementBias: -0.2,
            alphaTest: 0.01,
            depthWrite: true,
            depthTest: true,

            // wireframe: true,
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;

        // this.mesh.position.x -= 0.05;
        this.mesh.position.y += 0.1;
        this.mesh.receiveShadow = true;
    }
}
