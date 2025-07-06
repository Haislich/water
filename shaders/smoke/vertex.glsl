uniform float uTime;
uniform sampler2D uPerlinNoise;

varying vec2 vUv;
vec2 rotate2D(vec2 value, float angle)
{
    float s = sin(angle);
    float c = cos(angle);
    mat2 m = mat2(c, s, -s, c);
    return m * value;
}

void main()
{
    vec3 newPosition = position;
    // Twist effect
    float perlinTwist = 
        texture(
            uPerlinNoise,
            vec2(0.2,uv.y * 0.02 - uTime * 0.001)
            ).r ;
    float angle = perlinTwist * 10.0 ;
    newPosition.xz = rotate2D(newPosition.xz, angle);

    // wind effect
    vec2 windOffset = vec2(
        texture(uPerlinNoise,vec2(0.75,uTime * 0.001)).r - 0.5,
        texture(uPerlinNoise,vec2(0.75,uTime * 0.001)).r - 0.5
    );
    windOffset *= pow(uv.y,2.0) * 3.0;
    newPosition.xz += windOffset;
    // curva he simula il vento 

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPosition,1.0);
   
    vUv = uv;
}