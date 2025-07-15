precision highp float;
#include <utils> // includes intersectCube, IOR_AIR, IOR_WATER, poolHeight
uniform vec3 underwaterColor;

varying vec3 vWorldPosition;
void main() {
    gl_FragColor = vec4(getSphereColor(vWorldPosition), 1.0);
    vec4 info = texture2D(water, vWorldPosition.xz * 0.5 + 0.5);
    if(vWorldPosition.y < info.r) {
        gl_FragColor.rgb *= underwaterColor * 1.2;
    }
}