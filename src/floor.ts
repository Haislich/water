import * as THREE from 'three';
import { POOL_SIZE } from './constants';

export class Floor {
    public mesh;
    constructor(outerSize: number = 10) {
        const outerShape = new THREE.Shape();
        outerShape.moveTo(0, 0);
        outerShape.lineTo(outerSize, 0);
        outerShape.lineTo(outerSize, outerSize);
        outerShape.lineTo(0, outerSize);
        outerShape.lineTo(0, 0);

        // Inner square hole

        const holeOffset = (outerSize - POOL_SIZE) / 2; // center the hole
        const hole = new THREE.Path();
        hole.moveTo(holeOffset, holeOffset);
        hole.lineTo(holeOffset + POOL_SIZE, holeOffset);
        hole.lineTo(holeOffset + POOL_SIZE, holeOffset + POOL_SIZE);
        hole.lineTo(holeOffset, holeOffset + POOL_SIZE);
        hole.lineTo(holeOffset, holeOffset);

        // Add the hole to the shape
        outerShape.holes.push(hole);

        // Create geometry and mesh
        const geometry = new THREE.ShapeGeometry(outerShape);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.x -= outerSize / 2;
        this.mesh.position.z += outerSize / 2;

        this.mesh.position.y += 0.01;
    }
}
