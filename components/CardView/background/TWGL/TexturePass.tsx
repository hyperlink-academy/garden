import {
    createProgramInfo,
    primitives
} from 'twgl.js';
const data = require('../example.json');

export const getUniforms = (time: number, canvas: HTMLCanvasElement, texIn : WebGLTexture ) => ({
    diether: {
        time: time * 0.001,
        invert: data['texture-invert'],
        texIn: texIn,
        flip: data['texture-flipY'],
        u_threshold:  [
            0., 12., 3., 15.,
            8., 4., 11., 7.,
            2., 14., 1., 5.,
            10., 6., 9., 5
        ]
    },
    moire: {
        freqX: data['moire-freqX'],
        freqY: data['moire-freqY'],
        amountX: data['moire-amountX'],
        amountY: data['moire-amountY'],
        time: time * 0.001,
        invert: data['texture-invert'],
        texIn: texIn,
        flip: data['texture-flipY'],
        polar: data['moire-polar'],
    }
    
});

const baseVertexShaderSource = `attribute vec4 position;
    attribute vec2 texcoord;
    varying vec2 vUv;

    void main() {
        vUv = texcoord;
        gl_Position = position;
}`

const dietherFragmentShaderSource = `precision mediump float;

varying vec2 vUv;
uniform sampler2D texIn;
uniform float invert;
uniform float flip;
uniform float u_threshold[16];

void main()
{
    vec2 clip=vUv;
    clip.y=mix(clip.y,1.-clip.y,flip);
    
    // Normalized pixel coordinates (from 0 to 1)
    vec4 col=texture2D(texIn,clip);
    float lum=dot(vec3(.4824,.7608,.4078),col.rgb);
    
    // https://en.wikipedia.org/iki/Ordered_dithering
    int x=int(mod(gl_FragCoord.x,4.));
    int y=int(mod(gl_FragCoord.y,4.));
    int idx=x*4+y;
    
    //findClosest
    float t=
    u_threshold[0]*float(idx==0)+
    u_threshold[1]*float(idx==1)+
    u_threshold[2]*float(idx==2)+
    u_threshold[3]*float(idx==3)+
    u_threshold[4]*float(idx==4)+
    u_threshold[5]*float(idx==5)+
    u_threshold[6]*float(idx==6)+
    u_threshold[7]*float(idx==7)+
    u_threshold[8]*float(idx==8)+
    u_threshold[9]*float(idx==9)+
    u_threshold[10]*float(idx==10)+
    u_threshold[11]*float(idx==11)+
    u_threshold[12]*float(idx==12)+
    u_threshold[13]*float(idx==13)+
    u_threshold[14]*float(idx==14)+
    u_threshold[15]*float(idx==15);
    
    t=t/16.;
    
    lum=float(lum<t);
    
    vec4 outColor=vec4(lum);
    gl_FragColor=mix(1.-outColor,outColor,invert);
    
}`

const moireFragmentShaderSource = `precision mediump float;
varying vec2 vUv;
uniform float freqX;
uniform float freqY;
uniform float amountX;
uniform float amountY;
uniform float time;
uniform float invert;
uniform sampler2D texIn;
uniform float flip;
uniform bool polar;

vec2 getPolar(){
    vec2 pos=vUv*2.-1.;
    return vec2(length(pos),atan(pos.y,pos.x));
}
void main()
{
    vec2 uvN=vUv;
    uvN.y=mix(uvN.y,1.-uvN.y,flip);
    
    vec2 uv=vUv*2.-1.;
    
    if(polar){
        uv=getPolar();
    }
    
    vec4 oscX=cos(uv.xxxx*freqX+time);
    vec4 oscY=cos(uv.yyyy*freqY+time);
    vec4 pattern=texture2D(texIn,uvN);
    
    vec4 outColor=mix(pattern,oscX,pattern*amountX);
    outColor=mix(outColor,oscY,pattern*amountY);
    
    gl_FragColor=mix(outColor,1.-outColor,invert);
    
    
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

    const diether = initProgram(gl, dietherFragmentShaderSource);
    const moire = initProgram(gl, moireFragmentShaderSource);

    return {
        diether,
        moire
    }
}