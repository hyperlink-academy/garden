import {
    createProgramInfo,
    primitives
} from 'twgl.js';

const data = require('../example.json');

const parseColor = (color: { r: number, g: number, b: number, a: number }) => {
    return [color.r, color.g, color.b, color.a];
    
};

export const getUniforms = (time: number, canvas: HTMLCanvasElement, textures : {texture: any, light: any, pattern: any}) => {

    return {
        time: time * data['time'],
        background: parseColor(data['background-color']),
        layerZero: parseColor(data['layerZero-color']),
        layerOne: parseColor(data['layerOne-color']),
        layerTwo: parseColor(data['layerTwo-color']),
        off: [data['layers-offset'].x,data['layers-offset'].y], 
        mode: data['layers-mode'] || 0,
        toggleLayerZero: data['layerZero'],
        toggleLayerOne: data['layerOne'],
        toggleLayerTwo: data['layerTwo'],
        resolution: [canvas.width, canvas.height],
        texTexture: textures.texture,
        texShape: textures.light,
        texPattern: textures.pattern
    }
};



const baseVertexShaderSource = `attribute vec4 position;
    attribute vec2 texcoord;
    varying vec2 vUv;

    void main() {
        vUv = texcoord;
        gl_Position = position;
}`

const colorFragmentShaderSource = `precision mediump float;
varying vec2 vUv;
uniform vec2 resolution;

uniform sampler2D texTexture;
uniform sampler2D texShape;
uniform sampler2D texPattern;

uniform float time;
uniform vec4 background;
uniform vec4 layerZero;
uniform vec4 layerOne;
uniform vec4 layerTwo;

uniform vec2 off;

uniform bool toggleLayerZero;
uniform bool toggleLayerOne;
uniform bool toggleLayerTwo;
uniform int mode;

vec2 uvN(){return (gl_FragCoord.xy / resolution);}
vec2 uv(){return (gl_FragCoord.xy / resolution * 2.0 -1.0) * vec2(resolution.x/resolution.y, 1.0);}

vec2 symmetry(vec2 v){
    if(v.x<0.){
        v.x=abs(v.x);
    }
    if(v.y<0.){
        v.y=abs(v.y);
    }
    if(v.x>1.){
        v.x=1.-fract(v.x);
    }
    if(v.y>1.){
        v.y=1.-fract(v.y);
    }
    return v;
}
  
void main()
{
    vec2 uvN=uvN();
    vec4 shape=texture2D(texShape,uvN*1.);
    vec4 pattern=texture2D(texPattern,uvN);
    vec4 prev=texture2D(texTexture,uvN);
    vec4 prev2;
    if(mode==2){
        prev2=texture2D(texTexture,symmetry(uvN+off));
    }
    if(mode==1){
        prev2=texture2D(texTexture,fract(uvN+off));
    }
    if(mode==0){
        vec2 v=uvN+off;
        float inside=float(v.x>0.)*float(v.y>0.)*float(v.x<=1.)*float(v.y<=1.);
        prev2=texture2D(texTexture,v)*inside;
    }
    
    vec4 outColor=background;
    
    outColor=mix(outColor,layerZero,shape*1.5*float(toggleLayerZero));
    outColor=mix(outColor,layerOne,(prev.r)*float(toggleLayerOne));
    outColor=mix(outColor,layerTwo,(prev2.r)*float(toggleLayerTwo));
    
    gl_FragColor=outColor;
}`

export const initProgram = (gl: WebGLRenderingContext) => {

    const programInfo = createProgramInfo(gl, [
        baseVertexShaderSource,
        colorFragmentShaderSource
      ]);
      
    
    var bufferInfo = primitives.createXYQuadBufferInfo(gl);
 
    return {
        programInfo,
        bufferInfo
      }
}