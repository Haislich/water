import * as THREE from 'three';
import { CANVAS, FLOOR_ARM, FLOOR_COLOR, FLOOR_DISPLACEMENT, FLOOR_NORMAL } from './constants';

const generateGaussianSquareHoleAlphaMap = (
    size: number = 512,
    squareRatio: number = 0.3,
    sigma: number = 0.15 // smaller = sharper falloff
): THREE.CanvasTexture => {
    CANVAS.width = CANVAS.height = size;
    const ctx = CANVAS.getContext('2d')!;
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

    const texture = new THREE.CanvasTexture(CANVAS);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
};
// const centerUVs = (geometry: THREE.BufferGeometry, outerSize: number): void => {
//     const uvs = geometry.attributes.uv;
//     for (let i = 0; i < uvs.count; i++) {
//         // Original UVs go from 0 to 1 over the bounding box.
//         // We want UVs that treat (outerSize/2, outerSize/2) as center.
//         const x = geometry.attributes.position.getX(i);
//         const y = geometry.attributes.position.getY(i); // on XY plane

//         const newU = x / outerSize;
//         const newV = y / outerSize;

//         uvs.setXY(i, newU, newV);
//     }
//     uvs.needsUpdate = true;
// };
const POOL_SIZE = 2;

export class Floor {
    public mesh;
    constructor(outerSize: number = 10) {
        // const outerShape = new THREE.Shape();

        // outerShape.moveTo(0, 0);
        // outerShape.lineTo(outerSize, 0);
        // outerShape.lineTo(outerSize, outerSize);
        // outerShape.lineTo(0, outerSize);
        // outerShape.lineTo(0, 0);

        // // Inner square hole

        // const holeOffset = (outerSize - POOL_SIZE) / 2; // center the hole
        // const hole = new THREE.Path();
        // hole.moveTo(holeOffset, holeOffset);
        // hole.lineTo(holeOffset + POOL_SIZE, holeOffset);
        // hole.lineTo(holeOffset + POOL_SIZE, holeOffset + POOL_SIZE);
        // hole.lineTo(holeOffset, holeOffset + POOL_SIZE);
        // hole.lineTo(holeOffset, holeOffset);

        // // Add the hole to the shape
        // outerShape.holes.push(hole);

        // // Create geometry and mesh
        // const geometry = new THREE.ShapeGeometry(outerShape, 128);
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
        // this.mesh.position.x -= outerSize / 2;
        // this.mesh.position.z += outerSize / 2;

        this.mesh.position.y += 0.01;
    }
}
