import * as THREE from 'three';

export class Smoke {
    public mesh;
    constructor() {
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(Math.random(), 1, 16, 64), new THREE.MeshStandardMaterial({ color: new THREE.Color('white'), side: THREE.DoubleSide }));
        this.mesh.rotation.y = Math.random() * 2 * Math.PI;

        this.mesh.position.y += 0.5;
        this.mesh.position.x = Math.random() - 0.5;
    }
}
