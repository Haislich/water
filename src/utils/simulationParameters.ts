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
    sphereRadius: 0.2,

    // Light
    azimuth: 45,
    altitude: 40, // inizialmente e' sparata giu

    // Misc
    wallLightAbsorption: 0.5,
};
export const DIRECTIONAL_LIGHT = new THREE.DirectionalLight(0xffffff, 1);
DIRECTIONAL_LIGHT.position.set(1, 1, -0.5).normalize();

export const updateLightDirection = (): void => {
    const theta = THREE.MathUtils.degToRad(params.azimuth);
    const phi = THREE.MathUtils.degToRad(params.altitude);

    const x = Math.cos(phi) * Math.cos(theta);
    const y = Math.sin(phi);
    const z = Math.cos(phi) * Math.sin(theta);

    const dir = new THREE.Vector3(x, y, z).negate().normalize();

    DIRECTIONAL_LIGHT.position.copy(dir);
};
// updateLightDirection();

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
