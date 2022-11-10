import {
    createProgramInfo,
    primitives
} from 'twgl.js';


export const getUniforms = (time: number, canvas: HTMLCanvasElement, tex) => {
    //console.log(tex)
    return {
        time: time * 0.001,
        resolution: [canvas.width, canvas.height],
        texSource: tex
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
uniform sampler2D texSource;
uniform float time;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float color = 0.0;
  // lifted from glslsandbox.com
  color += cos(vUv.x*60.+time);
  vec4 texture = texture2D(texSource, vUv);

  gl_FragColor = vec4( vec3( 0., 0., color ) + texture.rgb, 1.0 );
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