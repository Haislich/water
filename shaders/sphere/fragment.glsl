precision highp float;
const float IOR_AIR = 1.0;
const float IOR_WATER = 1.333;
const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);

uniform vec3 light;
uniform vec3 sphereCenter;
uniform float sphereRadius;
uniform sampler2D causticTex;
uniform sampler2D water;

vec3 getSphereColor(vec3 point) {
    vec3 color = vec3(0.5);        /* ambient occlusion with walls */    
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((point.y + 1.0 + sphereRadius) / sphereRadius, 3.0);        /* caustics */    
    vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
    if(point.y < info.r) {
        vec4 caustic = texture2D(causticTex, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
        diffuse *= caustic.r * 4.0;
    }
    color += diffuse;
    return color;
}

varying vec3 vWorldPosition;
void main() {
    gl_FragColor = vec4(getSphereColor(vWorldPosition), 1.0);
    vec4 info = texture2D(water, vWorldPosition.xz * 0.5 + 0.5);
    if(vWorldPosition.y < info.r) {
        gl_FragColor.rgb *= underwaterColor * 1.2;
    }
}