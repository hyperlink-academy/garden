import {
    createProgramInfo,
    primitives
} from 'twgl.js';
  
export const getUniforms = (time: number, canvas: HTMLCanvasElement) => ({
    time: time * 0.001,
    resolution: [canvas.width, canvas.height],
});

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
uniform float time;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float color = 0.0;
  // lifted from glslsandbox.com
  color += cos(vUv.x*60.+time);

  gl_FragColor = vec4( vec3( 0., 0., color ), 1.0 );
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