uniform vec3 sphereCenter;
uniform float sphereRadius;

varying vec3 vWorldPosition;

void main() {
    vec3 localPos = position * sphereRadius;
    vec3 worldPos = sphereCenter + localPos;
    vWorldPosition = worldPos;

    gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
}
