import * as THREE from 'three';
import GUI from 'lil-gui';

export const params = {
    // Water
    aoStrength: 0.9,
    aoFalloffPower: 3.0,
    baseLightDiffuse: 0.5,
    causticProjectionScale: 0.75,
    causticBoost: 4.0,
    aboveWater: new THREE.Color(0.25, 1, 1.25),
    underWater: new THREE.Color(0.4, 0.9, 1.0),

    dropRadius: 0.03,
    dropStrength: 0.04,
    sphereRadius: 0.3,

    // Light
    azimuth: 45,
    altitude: 40, // inizialmente e' sparata giu

    // Misc
    wallLightAbsorption: 0.5,
};
export const DIRECTIONAL_LIGHT = new THREE.DirectionalLight(0xf2f3ae, 0.5);
export const updateLightDirection = (): void => {
    const theta = THREE.MathUtils.degToRad(params.azimuth); // horizontal angle around Y
    const phi = THREE.MathUtils.degToRad(-params.altitude); // fixed altitude => equator (XZ-plane)
    const r = 3; // radius

    // Point on the circle in XZ plane
    const x = Math.cos(phi) * Math.cos(theta); // becomes cos(theta)
    const y = Math.sin(phi); // becomes 0
    const z = Math.cos(phi) * Math.sin(theta); // becomes sin(theta)

    const dir = new THREE.Vector3(x, y, z).normalize();

    // Light is placed at point on the circumference, always pointing inward to origin
    DIRECTIONAL_LIGHT.position.copy(dir.clone().multiplyScalar(-r));
    // DIRECTIONAL_LIGHT.target.position.set(0, 0, 0);
    // DIRECTIONAL_LIGHT.target.updateMatrixWorld();
    DIRECTIONAL_LIGHT.lookAt(0, 0, 0);
};

updateLightDirection();

export const setupSimulationGUI = (gui: GUI): void => {
    const folder = gui.addFolder('Simulation Params');
    const waterFolder = gui.addFolder('Water Heightfield');
    waterFolder.add(params, 'aoStrength', 0.2, 1.2).step(0.1);
    waterFolder.add(params, 'aoFalloffPower', 1.5, 6).step(0.5);
    waterFolder.add(params, 'baseLightDiffuse', 0.3, 1.0).step(0.1);
    waterFolder.add(params, 'causticProjectionScale', 0.6, 1.0).step(0.1);
    waterFolder.add(params, 'causticBoost', 1, 6.0).step(1);
    waterFolder.addColor(params, 'aboveWater');
    waterFolder.addColor(params, 'underWater');
    waterFolder.open();

    folder.add(params, 'dropRadius', 0.01, 0.1).step(0.001);
    folder.add(params, 'dropStrength', -0.1, 0.1).step(0.001);
    folder.add(params, 'sphereRadius', 0.01, 0.5).step(0.001);
    folder.add(params, 'wallLightAbsorption', 0.01, 1.0).step(0.001);

    const lightFolder = gui.addFolder('Light Direction');
    lightFolder.add(params, 'azimuth', 1, 360, 1).onChange(updateLightDirection);
    lightFolder.add(params, 'altitude', 10, 80, 1).onChange(updateLightDirection);
    lightFolder.open();

    folder.open();
};
