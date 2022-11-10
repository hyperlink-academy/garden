import {
    createProgramInfo,
    primitives
} from 'twgl.js';
const data = require('../example.json');

export const getUniforms = (time: number, canvas: HTMLCanvasElement) => ({
    light: {
        time: time * 0.001,
        peak: data['light-peak'],
        intensity: data['light-intesity']
    },
    shadow: {
        p: data['shadow-p'],
        r: data['shadow-r'],
        border: data['shadow-border']
    }
    
});

const baseVertexShaderSource = `attribute vec4 position;
    attribute vec2 texcoord;
    varying vec2 vUv;

    void main() {
        vUv = texcoord;
        gl_Position = position;
}`

const lightFragmentShaderSource = `precision mediump float;
varying vec2 vUv;
uniform float time;
uniform float peak;
uniform float intensity;

#define PI 3.1415926

float superformula(vec2 pos,
    float m,
    float n1,
    float n2,
    float n3,
float scale){
    float r=length(pos)*(1./scale);
    float phi=atan(pos.y,pos.x)+PI;
    
    float f=pow(pow(abs(cos(m*phi/4.)),n2)+pow(abs(sin(m*phi/4.)),n3),-1./n1);
    
    return max(0.,.99*abs(r-f));
}

void main() {
    //Offset uv so that center is 0,0 and edges are -1,1
    vec2 uv=(vUv-vec2(.5))*2.;
    uv.x+=cos(dot(uv,uv)+time*.5);
    vec3 outColor=vec3(0.);
    
    float s=max(
        superformula(uv,peak,1.,1.,2.8,2.),
        superformula(uv,peak*3.,1.,2.,1.8,2.));
        
        s/=(2.-intensity)/cos(dot(s,s));
        
        outColor.r+=s;
        outColor.g+=s;
        outColor.b+=s;
        
        gl_FragColor=vec4(outColor,1.);
}`

const shadowFragmentShaderSource = `precision mediump float;
    varying vec2 vUv;
    uniform float time;
    uniform float p;
    uniform float r;
    uniform float border;
    #define PI 3.1415926

    float distance_p(vec2 pos,float p){
        float d=pow(abs(pos.x),p)+pow(abs(pos.y),p);
        d=pow(d,1./p);
        return d;
    }

    void main()
    {
        //Offset uv so that center is 0,0 and edges are -1,1
        vec2 uv=(vUv-vec2(.5))*2.;vec3 outColor;
        outColor+=smoothstep(0.,border,1.-distance_p(uv,p)-r);
        
        gl_FragColor=vec4(outColor,1.);
    }`

const initProgram = (gl: WebGLRenderingContext, fragmentSource: string) => {
   
    const programInfo = createProgramInfo(gl, [
        baseVertexShaderSource,
        fragmentSource
      ]);
    
    var bufferInfo = primitives.createXYQuadBufferInfo(gl);
 
    return {
        programInfo,
        bufferInfo
      }
}

export const initPrograms = (gl: WebGLRenderingContext) => {

    const light = initProgram(gl, lightFragmentShaderSource);
    const shadow = initProgram(gl, shadowFragmentShaderSource);

    return {
        light,
        shadow
    }
}