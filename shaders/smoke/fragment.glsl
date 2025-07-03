uniform float uTime;
uniform sampler2D uPerlinNoise;

varying vec2 vUv;

void main(){
    vec2 smokeUv = vUv;
    smokeUv.x *= 0.5;
    smokeUv.y *= 0.3;
    smokeUv.y -= uTime * 0.03;

    

    float smoke = texture(uPerlinNoise, smokeUv).r;
    smoke = smoothstep(0.35,1.,smoke);
    // Make the edges less aggressive
    smoke *= smoothstep(0.0, 0.2, vUv.x);
    smoke *= smoothstep(1.0, 0.8, vUv.x);

    smoke *= smoothstep(0.0, 0.2, vUv.y);
    smoke *= smoothstep(1.0, 0.8, vUv.y);

    // smoke = 1.0;
    
    gl_FragColor = vec4(1.,1.,1.,smoke);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>

}