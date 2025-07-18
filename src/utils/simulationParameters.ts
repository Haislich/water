import * as THREE from 'three';
import GUI from 'lil-gui';

export const params = {
    // Water
    /**
     * aoooo so della roma
     */
    aoStrength: 0.9,
    aoFalloffPower: 3.0,
    baseLightDiffuse: 0.5,
    causticProjectionScale: 0.75,
    causticBoost: 4.0,
    aboveWater: new THREE.Color(0xc9f3c9),
    underWater: new THREE.Color(0.4, 0.9, 1.0),

    // Caustics
    causticIntensityScale: 1.2,
    shadowBaseSoftness: 0.05,
    shadowDistanceScale: 0.025,
    shadowDistanceMixScale: 2.0,
    rimShadowSteepness: 200,
    rimShadowSlopeScale: 10,
    rimShadowVerticalOffset: 0.166,

    dropRadius: 0.03,
    dropStrength: 0.04,

    // Light
    azimuth: 50,
    altitude: 40,

    // Misc
    wallLightAbsorption: 0.5,
    sphereRadius: 0.3,
};
export const DIRECTIONAL_LIGHT = new THREE.DirectionalLight(0xf2f3ae, 1);
DIRECTIONAL_LIGHT.castShadow = true;
DIRECTIONAL_LIGHT.shadow.mapSize.set(2048, 2048);
DIRECTIONAL_LIGHT.shadow.bias = -0.0005;
DIRECTIONAL_LIGHT.shadow.camera.near = 1;
DIRECTIONAL_LIGHT.shadow.camera.far = 50;
DIRECTIONAL_LIGHT.shadow.camera.left = -10;
DIRECTIONAL_LIGHT.shadow.camera.right = 10;
DIRECTIONAL_LIGHT.shadow.camera.top = 10;
DIRECTIONAL_LIGHT.shadow.camera.bottom = -10;
export const updateLightDirection = (): void => {
    const theta = THREE.MathUtils.degToRad(params.azimuth);
    const phi = THREE.MathUtils.degToRad(-params.altitude);
    const radius = 2.5;

    // Point on the circle in XZ plane
    const x = Math.cos(phi) * Math.cos(theta);
    const y = Math.sin(phi);
    const z = Math.cos(phi) * Math.sin(theta);

    const dir = new THREE.Vector3(x, y, z).normalize();
    DIRECTIONAL_LIGHT.position.copy(dir.clone().multiplyScalar(-radius));
    DIRECTIONAL_LIGHT.lookAt(0, 0, 0);
};
updateLightDirection();

export const setupSimulationGUI = (gui: GUI): void => {
    // const folder = gui.addFolder('Simulation Params');

    const miscFolder = gui.addFolder('Misc parameters');
    miscFolder.add(params, 'sphereRadius', 0.01, 0.5).step(0.001);
    miscFolder.add(params, 'wallLightAbsorption', 0.01, 1.0).step(0.001);

    const waterSurfaceFolder = gui.addFolder('Water Surface');
    waterSurfaceFolder.add(params, 'aoStrength', 0.2, 1.2).step(0.1);
    waterSurfaceFolder.add(params, 'aoFalloffPower', 1.5, 6).step(0.5);
    waterSurfaceFolder.add(params, 'baseLightDiffuse', 0.3, 1.0).step(0.1);
    waterSurfaceFolder.add(params, 'causticProjectionScale', 0.6, 1.0).step(0.1);
    waterSurfaceFolder.add(params, 'causticBoost', 1, 6.0).step(1);
    waterSurfaceFolder.addColor(params, 'aboveWater');
    waterSurfaceFolder.addColor(params, 'underWater');
    // waterFolder.open();

    const causticsFolder = gui.addFolder('Caustics');
    causticsFolder.add(params, 'causticIntensityScale', 0, 2).step(0.05);
    causticsFolder.add(params, 'shadowBaseSoftness', 0, 0.2).step(0.001);
    causticsFolder.add(params, 'shadowDistanceScale', 0, 0.1).step(0.001);
    causticsFolder.add(params, 'shadowDistanceMixScale', 0, 5).step(0.5);
    causticsFolder.add(params, 'rimShadowSteepness', 50, 500).step(10);
    causticsFolder.add(params, 'rimShadowSlopeScale', 1, 20).step(1);
    causticsFolder.add(params, 'rimShadowVerticalOffset', 0, 1).step(0.01);

    // folder.add(params, 'dropRadius', 0.01, 0.1).step(0.001);
    // folder.add(params, 'dropStrength', -0.1, 0.1).step(0.001);

    const lightFolder = gui.addFolder('Light Direction');
    lightFolder.add(params, 'azimuth', 1, 180, 1).onChange(updateLightDirection);
    lightFolder.add(params, 'altitude', 10, 80, 1).onChange(updateLightDirection);
    lightFolder.open();

    // folder.open();
};
