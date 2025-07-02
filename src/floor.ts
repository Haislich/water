import * as THREE from 'three';
import { FLOOR_ARM, FLOOR_COLOR, FLOOR_DISPLACEMENT, FLOOR_NORMAL } from './constants';

/**
 * Generates a custom alpha map with:
 * - a black square in the center (fully transparent)
 * - a circular Gaussian falloff around the square (fade back to opaque)
 * - fully opaque corners
 */
const generateGaussianSquareHoleAlphaMap = (
    size: number = 512,
    squareRatio: number = 0.3,
    sigma: number = 0.15 // smaller = sharper falloff
): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const center = size / 2;
    const squareSize = size * squareRatio;
    const halfSquare = squareSize / 2;
    const sigmaSq = sigma * sigma;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - center;
            const dy = y - center;

            // Check if inside the black square
            if (Math.abs(dx) < halfSquare && Math.abs(dy) < halfSquare) {
                // Fully transparent
                const index = (y * size + x) * 4;
                data[index + 0] = 255;
                data[index + 1] = 255;
                data[index + 2] = 255;
                data[index + 3] = 0;
                continue;
            }

            // Otherwise, compute Gaussian based on distance from center
            const normDx = dx / center;
            const normDy = dy / center;
            const r2 = normDx * normDx + normDy * normDy;

            const gaussian = Math.exp(-r2 / (2 * sigmaSq));
            const alpha = Math.min(1.0, gaussian); // fade from 0 to 1
            const value = Math.floor(alpha * 255);

            const index = (y * size + x) * 4;
            data[index + 0] = 255;
            data[index + 1] = 255;
            data[index + 2] = 255;
            data[index + 3] = value;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
};

const POOL_SIZE = 2;

export class Floor {
    public mesh;
    constructor(outerSize: number = 10) {
        const ALPHA_MAP = generateGaussianSquareHoleAlphaMap(
            512,
            POOL_SIZE / outerSize, // so square matches world scale
            0.2 // control Gaussian spread
        );
        const geometry = new THREE.PlaneGeometry(outerSize, outerSize, outerSize * 10, outerSize * 10);
        // centerUVs(geometry, outerSize);
        const material = new THREE.MeshStandardMaterial({
            alphaMap: ALPHA_MAP,
            transparent: true,
            map: FLOOR_COLOR,
            aoMap: FLOOR_ARM,
            roughnessMap: FLOOR_ARM,
            metalnessMap: FLOOR_ARM,
            normalMap: FLOOR_NORMAL,
            side: THREE.DoubleSide,
            displacementMap: FLOOR_DISPLACEMENT,
            displacementScale: 0.3,
            displacementBias: -0.2,
            // wireframe: true,
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;

        this.mesh.position.y += 0.18;
    }
}
