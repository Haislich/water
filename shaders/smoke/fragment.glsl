uniform float uTime;
uniform sampler2D uPerlinNoise;

varying vec2 vUv;

void main(){
    vec2 smokeUv = vUv;
    smokeUv.x *= 0.5;
    smokeUv.y *= 0.3;
    smokeUv.y -= uTime * 0.03;

    

    float smoke = texture(uPerlinNoise, smokeUv).r;
    smoke = smoothstep(.4,1.,smoke);
    gl_FragColor = vec4(1,1,1,smoke);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>

}