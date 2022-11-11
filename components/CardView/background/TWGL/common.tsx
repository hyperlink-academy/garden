import {
    createProgramInfo,
    primitives
} from 'twgl.js';
export const data = require('../example.json'); 

function createTexture(gl: WebGLRenderingContext, texWidth: number, texHeight: number) {
    var texture = gl.createTexture();
     gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    return texture;
 }

export function createFBO(gl: WebGLRenderingContext, w: number, h: number) {
    const texture = createTexture(gl,w,h); 
    // Create and bind the framebuffer
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
    return {
        fbo,
        texture
    }
    
}

export const initProgram = (gl: WebGLRenderingContext, fragmentSource: string) => {
    const baseVertexShaderSource = `attribute vec4 position;
    attribute vec2 texcoord;
    varying vec2 vUv;

    void main() {
        vUv = texcoord;
        gl_Position = position;
    }`
    
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
