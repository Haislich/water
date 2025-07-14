import * as THREE from 'three';
import GUI from 'lil-gui';

export const params = {
    aboveWater: new THREE.Color('#40ffff'),
    underWater: new THREE.Color('#c8e0e6'),
    dropRadius: 0.03,
    dropStrength: 0.04,
    sphereRadius: 0.2,
};

export const setupSimulationGUI = (gui: GUI): void => {
    const folder = gui.addFolder('Simulation Params');

    folder.add(params, 'dropRadius', 0.01, 0.1).step(0.001);
    folder.add(params, 'dropStrength', -0.1, 0.1).step(0.001);

    folder.addColor(params, 'aboveWater');
    folder.addColor(params, 'underWater');

    folder.add(params, 'sphereRadius', 0.01, 0.5).step(0.001);
    folder.open();
};
